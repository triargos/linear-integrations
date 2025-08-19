import {
  AuthenticationLinearError,
  FeatureNotAccessibleLinearError,
  ForbiddenLinearError,
  InvalidInputLinearError,
  LinearError as OriginalLinearError,
  LinearErrorType,
  RatelimitedLinearError,
} from "@linear/sdk";
import { Data } from "effect";

// ============================================================================
// TYPES
// ============================================================================

interface LinearBaseErrorContext {
  type: LinearErrorType;
  query?: string;
  variables?: Record<string, unknown>;
  message: string;
}

interface LinearRateLimitErrorContext extends LinearBaseErrorContext {
  retryAfter: number | undefined;
  requestsLimit: number | undefined;
  requestsRemaining: number | undefined;
  requestsResetAt: number | undefined;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Linear API forbidden access error.
 * Used when the user lacks permissions for a resource or when a feature is not accessible.
 * Caused by `ForbiddenLinearError` or `FeatureNotAccessibleLinearError` from Linear SDK.
 */
export class LinearForbiddenError extends Data.TaggedError(
  "LinearForbiddenError",
)<LinearBaseErrorContext> {}

/**
 * Linear API invalid input error.
 * Used when the request contains invalid parameters or malformed data.
 * Caused by `InvalidInputLinearError` from Linear SDK.
 */
export class LinearInvalidInputError extends Data.TaggedError(
  "LinearInvalidInputError",
)<LinearBaseErrorContext> {}

/**
 * Linear API rate limit error.
 * Used when the API rate limit has been exceeded.
 * Contains additional context about retry timing and request limits.
 * Caused by `RatelimitedLinearError` from Linear SDK.
 */
export class LinearRateLimitError extends Data.TaggedError(
  "LinearRateLimitError",
)<LinearRateLimitErrorContext> {}

/**
 * Linear API internal error.
 * Used for unrecognized Linear SDK errors or general internal failures.
 * Acts as a fallback error when specific error types cannot be determined.
 * Caused by unknown Linear errors or non-Linear exceptions.
 */
export class LinearInternalError extends Data.TaggedError(
  "LinearInternalError",
)<LinearBaseErrorContext> {}

/**
 * Linear API authentication error.
 * Used when the API token is invalid, expired, or missing.
 * Caused by `AuthenticationLinearError` from Linear SDK.
 */
export class LinearAuthenticationError extends Data.TaggedError(
  "LinearAuthenticationError",
)<LinearBaseErrorContext> {}

/**
 * Union type for all custom Linear errors.
 */
export type LinearError =
  | LinearForbiddenError
  | LinearInvalidInputError
  | LinearRateLimitError
  | LinearInternalError
  | LinearAuthenticationError;

// ============================================================================
// UTILS
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export const handleLinearError = (error: unknown) => {
  if (error instanceof OriginalLinearError && error.type) {
    const baseOptions: LinearBaseErrorContext = {
      query: error.query,
      message: error.message,
      type: error.type,
      variables: error.variables,
    };
    if (error instanceof AuthenticationLinearError) {
      return new LinearAuthenticationError(baseOptions);
    }
    if (
      error instanceof ForbiddenLinearError ||
      error instanceof FeatureNotAccessibleLinearError
    ) {
      return new LinearForbiddenError(baseOptions);
    }
    if (error instanceof InvalidInputLinearError) {
      return new LinearInvalidInputError(baseOptions);
    }
    if (error instanceof RatelimitedLinearError) {
      return new LinearRateLimitError({
        ...baseOptions,
        retryAfter: error.retryAfter,
        requestsLimit: error.requestsLimit,
        requestsRemaining: error.requestsRemaining,
        requestsResetAt: error.requestsResetAt,
      });
    }
    return new LinearInternalError(baseOptions);
  }
  const baseOptions: LinearBaseErrorContext = {
    message: getErrorMessage(error),
    type: LinearErrorType.Unknown,
  };
  return new LinearInternalError(baseOptions);
};

interface WithLinearErrorContext {
  error: OriginalLinearError;
}

export function getLinearErrorCause<TError extends WithLinearErrorContext>(
  error: TError,
) {
  return error.error;
}
