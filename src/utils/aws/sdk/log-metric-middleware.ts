import { randomUUID } from 'node:crypto';
import { hrtime } from 'node:process';
import { inspect, InspectOptions } from 'node:util';
import type { InitializeMiddleware, MetadataBearer } from '@aws-sdk/types';

import { loggerFactory } from '../../logger/logger-factory.js';
import type { Logger } from '../../logger/logger.js';

const defaultInspectOptions = {
  depth: Number.POSITIVE_INFINITY,
  breakLength: Number.POSITIVE_INFINITY,
  maxArrayLength: Number.POSITIVE_INFINITY,
  maxStringLength: Number.POSITIVE_INFINITY,
  compact: true,
};
const identity = <T>(x: T) => x;
let requestId = 0;
export const logMetricMiddleware = {
  create: <Input extends object, Output extends MetadataBearer>({
    inspectOptions = defaultInspectOptions,
    logger = loggerFactory.create(),
  }: {
    inspectOptions?: InspectOptions;
    logger?: Logger;
  } = {}): InitializeMiddleware<Input, Output> => {
    return (next, context) => {
      return async args => {
        const {
          clientName,
          commandName,
          dynamoDbDocumentClientOptions = {},
        } = context;
        const {
          overrideInputFilterSensitiveLog,
          overrideOutputFilterSensitiveLog,
        } = dynamoDbDocumentClientOptions;
        const nameSpace = `[${clientName}.${commandName}.${requestId++}]`;
        const inputFilterSensitiveLog =
          overrideInputFilterSensitiveLog ??
          context['inputFilterSensitiveLog'] ??
          identity;
        logger.info(
          `${nameSpace} request: ${inspect(
            inputFilterSensitiveLog(args.input),
            inspectOptions,
          )}`,
        );
        const start = hrtime.bigint();
        const result = await next(args);
        const end = hrtime.bigint();
        logger.info(
          `${nameSpace} METRIC elapsed time: ${Number(end - start) / 1e6}ms`,
        );
        const outputFilterSensitiveLog =
          overrideOutputFilterSensitiveLog ??
          context['outputFilterSensitiveLog'] ??
          identity;
        const { $metadata, ...outputWithoutMetadata } = result.output;
        logger.info(
          `${nameSpace} response: ${inspect(
            {
              $metadata,
              ...outputFilterSensitiveLog(outputWithoutMetadata),
            },
            inspectOptions,
          )}`,
        );
        return result;
      };
    };
  },
};
