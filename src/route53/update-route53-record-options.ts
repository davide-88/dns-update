import { parseArgs } from 'node:util';

import { requireDefined } from '../utils/typescript/require-defined.js';

export const UPDATE_IP = {
  IP_V4: 'ipv4',
  IP_V6: 'ipv6',
  BOTH: 'both',
} as const;
export type UpdateIp = (typeof UPDATE_IP)[keyof typeof UPDATE_IP];
export const updateIp = Object.values(UPDATE_IP) as UpdateIp[];

export const parseOptions = (): {
  hostedZoneId: string;
  recordName: string;
  updateIp: UpdateIp;
} => {
  const args = process.argv.slice(2, process.argv.length);
  const { values } = parseArgs({
    args,
    options: {
      hostedZoneId: {
        type: 'string',
        short: 'z',
        multiple: false,
      },
      recordName: {
        type: 'string',
        short: 'r',
        multiple: false,
      },
      updateIp: {
        type: 'string',
        short: 'i',
        multiple: false,
        default: 'ipv4',
      },
    },
  });
  return {
    hostedZoneId: requireDefined(
      values.hostedZoneId,
      'hostedZoneId is required',
    ),
    recordName: requireDefined(values.recordName, 'recordName is required'),
    updateIp:
      values.updateIp && values.updateIp in updateIp
        ? (values.updateIp as UpdateIp)
        : UPDATE_IP.IP_V4,
  };
};
