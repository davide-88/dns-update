import { hrtime } from 'node:process';
import { inspect } from 'node:util';

import { route53ClientFactory } from '../utils/aws/sdk/route53-client-factory.js';
import { loggerFactory } from '../utils/logger/logger-factory.js';

import { parseOptions, UPDATE_IP } from './update-route53-record-options.js';
import { updateRoute53Record } from './update-route53-record.js';

const logger = loggerFactory.create({
  context: 'update-route53-record-run',
});

try {
  const start = hrtime.bigint();
  const { hostedZoneId, recordName, updateIp } = parseOptions();

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
          hostIp: 'dig +short ch txt whoami.cloudflare -4 @1.1.1.1',
          domainIp: `dig +short ${recordName} A`,
        },
        context: UPDATE_IP.IP_V4,
      },
      {
        commands: {
          hostIp:
            'dig +short ch txt whoami.cloudflare -6 @2606:4700:4700::1111',
          domainIp: `dig +short ${recordName} AAAA`,
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
