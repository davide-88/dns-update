import {
  IP_VERSION,
  type IpVersion,
} from '../../route53/public-ip-resolver/public-host-ip-resolver.js';

const ipRegexpByVersion = {
  [IP_VERSION.V4]: /^(\d{1,3}\.){3}\d{1,3}$/,
  [IP_VERSION.V6]: /^([0-9a-f]{1, 4}:){7}[0-9a-f]{0,4}$/,
} as const;

export const ipValidator = {
  validate: ({ version, ip }: { version: IpVersion; ip: string }): boolean => {
    return ipRegexpByVersion[version].test(ip);
  },
};
