import { inspect, parseArgs } from 'node:util';

import { route53ClientFactory } from '../utils/aws/sdk/route53-client-factory.js';
import { loggerFactory } from '../utils/logger/logger-factory.js';

import { updateRoute53Record } from './update-route53-record.js';

const logger = loggerFactory.create({
  context: 'update-route53-record-run',
});
try {
  const args = process.argv.slice(2, process.argv.length);
  const { values } = parseArgs({
    args,
    options: {
      hostedZoneId: {
        type: 'string',
        short: 'h',
        multiple: false,
      },
      recordName: {
        type: 'string',
        short: 'r',
        multiple: false,
      },
    },
  });
  const { hostedZoneId, recordName } = values;
  if (!hostedZoneId) {
    throw new Error('hostedZoneId is required');
  }
  if (!recordName) {
    throw new Error('recordName is required');
  }

  const updateOptions = {
    resourceRecordSetProps: {
      hostedZoneId,
      name: recordName,
    },
  };
  await Promise.all([
    updateRoute53Record({
      retrieveIpCommand: 'dig +short ch txt whoami.cloudflare -4 @1.1.1.1',
      ...updateOptions,
      client: route53ClientFactory.create({
        logger: loggerFactory.create({ context: 'update-route53-record-ipv4' }),
      }),
    }),
    updateRoute53Record({
      retrieveIpCommand:
        'dig +short ch txt whoami.cloudflare -6 @2606:4700:4700::1111',
      ...updateOptions,
      client: route53ClientFactory.create({
        logger: loggerFactory.create({ context: 'update-route53-record-ipv6' }),
      }),
    }),
  ]);
} catch (e) {
  logger.error(`An error occurred: ${inspect(e, { depth: null })}`);
  process.exit(1);
}
