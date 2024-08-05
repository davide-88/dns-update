import { exec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import {
  ChangeResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';

import { loggerFactory } from '../utils/logger/logger-factory.js';
import { Logger } from '../utils/logger/logger.js';
import { requireDefined } from '../utils/typescript/require-defined.js';

const execPromise = promisify(exec);

export const updateRoute53Record = async ({
  retrieveIpCommand,
  client,
  resourceRecordSetProps,
  logger = loggerFactory.create({
    context: 'update-route53-record',
  }),
}: {
  retrieveIpCommand: string;
  client: Route53Client;
  resourceRecordSetProps: {
    hostedZoneId: string;
    name: string;
    ttl?: number;
  };
  logger?: Logger;
}) => {
  const retrieveIpCommandOutput = await execPromise(retrieveIpCommand);
  const ip = requireDefined(
    /"(?<ip>.*)"/.exec(retrieveIpCommandOutput.stdout)?.groups?.ip,
    `Failed to retrieve IP address: ${inspect(retrieveIpCommandOutput, { depth: null })}`,
  );

  //regexp ip v4
  const isIpV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  const isIpV6 = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/.test(ip);
  if (!isIpV4 && !isIpV6) {
    throw new Error(`Invalid IP address: ${ip}`);
  }

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
};
