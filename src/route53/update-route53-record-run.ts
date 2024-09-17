import { lookup } from 'node:dns/promises';
import { hrtime } from 'node:process';
import { inspect } from 'node:util';

import { route53ClientFactory } from '../utils/aws/sdk/route53-client-factory.js';
import { loggerFactory } from '../utils/logger/logger-factory.js';

import { IP_VERSION } from './public-ip-resolver/public-host-ip-resolver.js';
import { resolvePublicHostIp } from './public-ip-resolver/resolve-public-host-ip.js';
import { parseOptions, UPDATE_IP } from './update-route53-record-options.js';
import { updateRoute53Record } from './update-route53-record.js';

const logger = loggerFactory.create({
  context: 'update-route53-record-run',
});

try {
  const start = hrtime.bigint();
  const { hostedZoneId, recordName, updateIp } = parseOptions();
  logger.debug(
    `Input options: ${inspect({ hostedZoneId, recordName, updateIp })}`,
  );

  const updateOptions = {
    resourceRecordSetProps: {
      hostedZoneId,
      name: recordName,
    },
  };
  await Promise.all(
    [
      {
        commands: {
          hostIp: async () => (await resolvePublicHostIp(IP_VERSION.V4)).ip,
          domainIp: async () =>
            (
              await lookup(recordName, {
                family: 4,
              })
            ).address,
        },
        context: UPDATE_IP.IP_V4,
      },
      {
        commands: {
          hostIp: async () => (await resolvePublicHostIp(IP_VERSION.V6)).ip,
          domainIp: async () =>
            (
              await lookup(recordName, {
                family: 6,
              })
            ).address,
        },
        context: UPDATE_IP.IP_V6,
      },
    ]
      .filter(
        ({ context }) => updateIp === UPDATE_IP.BOTH || updateIp === context,
      )
      .map(({ commands, context }) =>
        updateRoute53Record({
          commands,
          ...updateOptions,
          client: route53ClientFactory.create({
            logger: loggerFactory.create({ context }),
          }),
        }),
      ),
  );
  const end = hrtime.bigint();
  logger.info(`Total elapsed time: ${Number(end - start) / 1e6}ms`);
} catch (e) {
  logger.error(`An error occurred: ${inspect(e, { depth: null })}`);
  process.exit(1);
}
