export type ErrorMessageProvider = () => string;

export const requireDefined = /* @__PURE__ */ <T>(
  nullable: T | undefined | null,
  message: string | ErrorMessageProvider = () => 'Not Defined',
): T => {
  if (nullable === undefined || nullable === null) {
    throw new NotDefinedError(
      message instanceof Function ? message() : message,
    );
  }
  return nullable;
};

export class NotDefinedError extends Error {}
