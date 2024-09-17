import { DnsPublicHostIpResolver } from './dns-public-host-ip-resolver.js';
import type { IpVersion } from './public-host-ip-resolver.js';

export const resolvePublicHostIp = async (
  version: IpVersion,
): Promise<{
  ip: string;
}> => {
  return new DnsPublicHostIpResolver(version).resolve();
};
