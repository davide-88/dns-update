import { exec as nodeExec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import {
  ChangeResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { loggerFactory } from '../utils/logger/logger-factory.js';
import { Logger } from '../utils/logger/logger.js';
import { requireDefined } from '../utils/typescript/require-defined.js';

const exec = promisify(nodeExec);

export const updateRoute53Record = async ({
  client,
  commands,
  resourceRecordSetProps,
  logger = loggerFactory.create({
    context: 'update-route53-record',
  }),
}: {
  commands: {
    hostIp: string;
    domainIp: string;
  };
  client: Route53Client;
  resourceRecordSetProps: {
    hostedZoneId: string;
    name: string;
    ttl?: number;
  };
  logger?: Logger;
}) => {
  logger.debug(`Retrieving Host IP address using command: ${commands.hostIp}`);
  logger.debug(
    `Retrieving Domain IP address using command: ${commands.domainIp}`,
  );
  const [hostIpCommandOutput, domainIpCommandOutput] = await Promise.all([
    exec(commands.hostIp),
    exec(commands.domainIp),
  ]);
  logger.debug(`Retrieved Host IP address: ${hostIpCommandOutput.stdout}`);
  logger.debug(`Retrieved Domain IP address: ${domainIpCommandOutput.stdout}`);
  const ip = requireDefined(
    /"(?<ip>.*)"/.exec(hostIpCommandOutput.stdout)?.groups?.ip,
    `Failed to retrieve IP address: ${inspect(hostIpCommandOutput, { depth: null })}`,
  );

  //regexp ip v4
  const isIpV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  const isIpV6 = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/.test(ip);
  if (!isIpV4 && !isIpV6) {
    throw new Error(`Invalid IP address: ${ip}`);
  }

  const domainIp = domainIpCommandOutput.stdout.trim();
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
