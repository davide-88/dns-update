import { Resolver } from 'node:dns';
import { inspect, promisify } from 'node:util';

import { loggerFactory } from '../../utils/logger/logger-factory.js';

import {
  CouldNotResolvePublicHostIpError,
  IpVersion,
  PublicHostIpResolver,
  ResolvedIp,
} from './public-host-ip-resolver.js';

const RECORD_TYPE = {
  A: 'A',
  AAAA: 'AAAA',
  TXT: 'TXT',
} as const;

type RecordType = (typeof RECORD_TYPE)[keyof typeof RECORD_TYPE];

type DnsServer<
  V4Type extends Exclude<RecordType, typeof RECORD_TYPE.AAAA>,
  V6Type extends Exclude<RecordType, typeof RECORD_TYPE.A>,
> = {
  v4: {
    servers: string[];
    name: string;
    type: V4Type;
    transform: (records: unknown) => string;
  };
  v6: {
    servers: string[];
    name: string;
    type: V6Type;
    transform: (records: unknown) => string;
  };
};

const transformers = {
  A: (records: unknown): string => {
    if (
      Array.isArray(records) &&
      records.length === 1 &&
      typeof records[0] === 'string'
    ) {
      return records[0];
    } else {
      throw new CouldNotResolvePublicHostIpError(
        `${inspect(records)} is not a valid response`,
      );
    }
  },
  AAAA: (records: unknown): string => {
    if (
      Array.isArray(records) &&
      records.length === 1 &&
      typeof records[0] === 'string'
    ) {
      return records[0];
    } else {
      throw new CouldNotResolvePublicHostIpError(
        `${inspect(records)} is not a valid response`,
      );
    }
  },
  TXT: (records: unknown): string => {
    if (
      Array.isArray(records) &&
      records.length === 1 &&
      Array.isArray(records[0]) &&
      records.length === 1 &&
      typeof records[0][0] === 'string'
    ) {
      return records[0][0];
    } else {
      throw new CouldNotResolvePublicHostIpError(
        `${inspect(records)} is not a valid response`,
      );
    }
  },
};

const dnsServers: (DnsServer<'A', 'AAAA'> | DnsServer<'TXT', 'TXT'>)[] = [
  {
    v4: {
      servers: [
        '208.67.222.222',
        '208.67.220.220',
        '208.67.222.220',
        '208.67.220.222',
      ],
      name: 'myip.opendns.com',
      type: RECORD_TYPE.A,
      transform: transformers.A,
    },
    v6: {
      servers: ['2620:0:ccc::2', '2620:0:ccd::2'],
      name: 'myip.opendns.com',
      type: RECORD_TYPE.AAAA,
      transform: transformers.AAAA,
    },
  },
  {
    v4: {
      servers: [
        '216.239.32.10',
        '216.239.34.10',
        '216.239.36.10',
        '216.239.38.10',
      ],
      name: 'o-o.myaddr.l.google.com',
      type: RECORD_TYPE.TXT,
      transform: transformers.TXT,
    },
    v6: {
      servers: [
        '2001:4860:4802:32::a',
        '2001:4860:4802:34::a',
        '2001:4860:4802:36::a',
        '2001:4860:4802:38::a',
      ],
      name: 'o-o.myaddr.l.google.com',
      type: RECORD_TYPE.TXT,
      transform: transformers.TXT,
    },
  },
];

export class DnsPublicHostIpResolver extends PublicHostIpResolver {
  constructor(
    version: IpVersion,
    private logger = loggerFactory.create({
      context: `dns-public-host-ip-resolver-${version}`,
    }),
  ) {
    super(version);
  }

  async resolve(): Promise<ResolvedIp> {
    for (const dnsServer of dnsServers) {
      const dnsServerForSpecificVersion = dnsServer[this.version];
      const resolver = new Resolver();
      resolver.setServers(dnsServerForSpecificVersion.servers);
      try {
        const resolve = promisify(resolver.resolve.bind(resolver));
        const records = await resolve(
          dnsServerForSpecificVersion.name,
          dnsServerForSpecificVersion.type,
        );
        this.logger.debug(`records: ${inspect(records, { depth: null })}`);
        return {
          ip: dnsServerForSpecificVersion.transform(records),
        };
      } catch (err) {
        console.error('Error querying DNS:', err);
      }
    }
    throw new CouldNotResolvePublicHostIpError(
      'Could not resolve public host IP',
    );
  }
}
