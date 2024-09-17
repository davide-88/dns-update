import { inspect } from 'node:util';

import { loggerFactory } from '../../utils/logger/logger-factory.js';

import { DnsPublicHostIpResolver } from './dns-public-host-ip-resolver.js';
import { HttpPublicHostIpResolver } from './http-public-host-ip-resolver.js';
import {
  CouldNotResolvePublicHostIpError,
  IpVersion,
} from './public-host-ip-resolver.js';

const logger = loggerFactory.create({
  context: 'resolve-public-host-ip',
});
export const resolvePublicHostIp = async (
  version: IpVersion,
): Promise<{
  ip: string;
}> => {
  const resolvers = [DnsPublicHostIpResolver, HttpPublicHostIpResolver];
  for (const resolver of resolvers) {
    try {
      return await new resolver(version).resolve();
    } catch (error) {
      logger.error(
        `Error resolving IP ${version}: ${inspect(error, { depth: null })}`,
      );
    }
  }
  throw new CouldNotResolvePublicHostIpError(
    'Could not resolve public host IP',
  );
};
