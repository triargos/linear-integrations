/**
 * @fileoverview Generic errors submodule export
 * Re-exports all generic Linear API error classes, types, and utilities for external consumption.
 */
export {
  LinearAuthenticationError,
  LinearForbiddenError,
  LinearInternalError,
  LinearInvalidInputError,
  LinearRateLimitError,
  type LinearError,
  getLinearErrorCause,
} from './internal/error.ts';

//Triage errors
export * from './modules/triage-responsibilities/triage-responsibilities-errors.ts';
//Customer errors
export * from "./modules/customer/customer-errors.ts"
