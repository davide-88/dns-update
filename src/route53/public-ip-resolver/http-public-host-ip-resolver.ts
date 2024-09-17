import { inspect } from 'node:util';

import { loggerFactory } from '../../utils/logger/logger-factory.js';

import {
  CouldNotResolvePublicHostIpError,
  IpVersion,
  PublicHostIpResolver,
  ResolvedIp,
} from './public-host-ip-resolver.js';

const apiProviders: {
  [version in IpVersion]: {
    servers: string[];
    transform: (text: Response) => Promise<string>;
  };
}[] = [
  {
    v4: {
      servers: [
        'https://1.1.1.1/cdn-cgi/trace',
        'https://1.0.0.1/cdn-cgi/trace',
      ],
      transform: async (response: Response): Promise<string> => {
        const text = await response.text();
        const match = /.*ip=(?<ip>(\d{1,3}\.){3}\d{1,3}).*/.exec(text);
        if (!match || !match.groups || !match.groups.ip) {
          throw new CouldNotResolvePublicHostIpError(
            `Could not find IP in ${inspect(text)}`,
          );
        }
        return match.groups.ip;
      },
    },
    v6: {
      servers: [
        'https://[2606:4700:4700::1111]/cdn-cgi/trace',
        'https://[2606:4700:4700::1001]/cdn-cgi/trace',
      ],
      transform: async (response: Response): Promise<string> => {
        const text = await response.text();
        const match = /.*ip=(?<ip>([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}).*/.exec(
          text,
        );
        if (!match || !match.groups || !match.groups.ip) {
          throw new CouldNotResolvePublicHostIpError(
            `Could not find IP in ${inspect(text)}`,
          );
        }
        return match.groups.ip;
      },
    },
  },
  {
    v4: {
      servers: ['https://api.ipify.org?format=json'],
      transform: async (response: Response): Promise<string> => {
        const json = await response.json();
        if (
          !json ||
          typeof json !== 'object' ||
          !('ip' in json) ||
          typeof json.ip !== 'string'
        ) {
          throw new CouldNotResolvePublicHostIpError(
            `Could not find IP in ${inspect(json)}`,
          );
        }
        return json.ip;
      },
    },
    v6: {
      servers: ['https://api6.ipify.org?format=json'],
      transform: async (response: Response): Promise<string> => {
        const json = await response.json();
        if (
          !json ||
          typeof json !== 'object' ||
          !('ip' in json) ||
          typeof json.ip !== 'string'
        ) {
          throw new CouldNotResolvePublicHostIpError(
            `Could not find IP in ${inspect(json)}`,
          );
        }
        return json.ip;
      },
    },
  },
];

export class HttpPublicHostIpResolver extends PublicHostIpResolver {
  constructor(
    version: IpVersion,
    private logger = loggerFactory.create({
      context: `http-public-host-ip-resolver-${version}`,
    }),
  ) {
    super(version);
  }

  async resolve(): Promise<ResolvedIp> {
    for (const provider of apiProviders) {
      for (const server of provider[this.version].servers) {
        this.logger.debug(`Trying to get IP from ${server}`);
        try {
          const resp = await fetch(server);
          this.logger.debug(`Response: ${inspect(resp, { depth: null })}`);
          return {
            ip: await provider[this.version].transform(resp),
          };
        } catch (err) {
          this.logger.error(
            `Error querying API: ${inspect(err, { depth: null })}`,
          );
        }
      }
    }
    throw new CouldNotResolvePublicHostIpError(
      'Could not resolve public host IP',
    );
  }
}
