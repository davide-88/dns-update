export const IP_VERSION = {
  V4: 'v4',
  V6: 'v6',
} as const;

export type IpVersion = (typeof IP_VERSION)[keyof typeof IP_VERSION];

export type ResolvedIp = { ip: string };

export class CouldNotResolvePublicHostIpError implements Error {
  public readonly name: string = 'CouldNotResolvePublicHostIpError';

  constructor(public readonly message: string) {}
}

export abstract class PublicHostIpResolver {
  protected constructor(protected version: IpVersion) {}

  abstract resolve(): Promise<ResolvedIp>;
}
