import { inspect } from 'node:util';
import {
  ChangeResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { loggerFactory } from '../utils/logger/logger-factory.js';
import { Logger } from '../utils/logger/logger.js';
import { requireDefined } from '../utils/typescript/require-defined.js';

export const updateRoute53Record = async ({
  client,
  commands,
  resourceRecordSetProps,
  logger = loggerFactory.create({
    context: 'update-route53-record',
  }),
}: {
  commands: {
    hostIp: () => Promise<string>;
    domainIp: () => Promise<string>;
  };
  client: Route53Client;
  resourceRecordSetProps: {
    hostedZoneId: string;
    name: string;
    ttl?: number;
  };
  logger?: Logger;
}) => {
  logger.debug(`Retrieving Host and Domain IPs`);
  const [hostIpCommandOutput, domainIpCommandOutput] = await Promise.all([
    commands.hostIp(),
    commands.domainIp(),
  ]);
  logger.debug(`Retrieved Host IP address: ${hostIpCommandOutput}`);
  logger.debug(`Retrieved Domain IP address: ${domainIpCommandOutput}`);
  const ip = requireDefined(
    hostIpCommandOutput,
    `Failed to retrieve IP address: ${inspect(hostIpCommandOutput, { depth: null })}`,
  );

  //regexp ip v4
  const isIpV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  const isIpV6 = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/.test(ip);
  if (!isIpV4 && !isIpV6) {
    throw new Error(`Invalid IP address: ${ip}`);
  }

  const domainIp = domainIpCommandOutput.trim();
  if (ip === domainIp) {
    logger.info(`Domain IP address is already up-to-date: ${ip}`);
    return;
  }

  logger.debug(
    `Updating Route 53 record: ${resourceRecordSetProps.name} with IPv${isIpV4 ? '4' : '6'} address: ${ip}`,
  );
  await client.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: resourceRecordSetProps.hostedZoneId,
      ChangeBatch: {
        Comment: 'Update IP address',
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: resourceRecordSetProps.name,
              Type: isIpV4 ? 'A' : 'AAAA',
              TTL: resourceRecordSetProps.ttl ?? 300,
              ResourceRecords: [
                {
                  Value: ip,
                },
              ],
            },
          },
        ],
      },
    }),
  );
  logger.debug(`Updated Route 53 record!`);
};
