import { Route53Client, Route53ClientConfig } from '@aws-sdk/client-route-53';

import { LOG_LEVEL_LABEL } from '../../logger/log-level.js';
import { loggerFactory } from '../../logger/logger-factory.js';

import { logMetricMiddleware } from './log-metric-middleware.js';
import { Logger } from '../../logger/logger.js';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { requireDefined } from '../../typescript/require-defined.js';

export type CreateRoute53ClientOptions = Omit<Route53ClientConfig, 'logger'> & { logger: Logger };
export const route53ClientFactory = {
  create: (config?: CreateRoute53ClientOptions): Route53Client => {
    const logger = config?.logger ?? loggerFactory.create({ level: LOG_LEVEL_LABEL.WARN });
    const route53Client = new Route53Client({
      ...config,
      logger: logger,
      credentials: fromTemporaryCredentials({
        logger,
        masterCredentials: {
          accessKeyId: requireDefined(process.env.AWS_ACCESS_KEY_ID, 'The environment variable AWS_ACCESS_KEY_ID is not defined'),
          secretAccessKey: requireDefined(process.env.AWS_SECRET_ACCESS_KEY, 'The environment variable AWS_SECRET_ACCESS_KEY is not defined'),
        },
        params: {
          DurationSeconds: 900,
          ExternalId: requireDefined(process.env.AWS_EXTERNAL_ID, 'The environment variable AWS_EXTERNAL_ID is not defined'),
          RoleArn: requireDefined(process.env.AWS_ROLE_ARN, 'The environment variable AWS_ROLE_ARN is not defined'),
        },
      }),
    });
    route53Client.middlewareStack?.add(logMetricMiddleware.create({ logger }), {
      step: 'initialize',
      priority: 'low',
      tags: ['metric_logger'],
    });
    return route53Client;
  },
};
