import { Data } from 'effect';
import { LinearError } from '../../internal/error.ts';
import {
  CreateTriageResponsibilityOptions,
  UpdateTriageResponsibilityOptions,
} from './triage-responsibilities-schemas.ts';

/**
 * Error thrown when listing triage responsibilities fails.
 * Caused by Linear API errors during retrieval of triage responsibility list.
 */
export class ListTriageResponsibilitiesError extends Data.TaggedError(
  'ListTriageResponsibilitiesError'
)<{
  error: LinearError;
}> {}

/**
 * Error thrown when finding a specific triage responsibility fails.
 * Caused by Linear API errors or when the triage responsibility is not found.
 */
export class FindTriageResponsibilityError extends Data.TaggedError(
  'FindTriageResponsibilityError'
)<{
  error: LinearError;
  id: string;
}> {}

/**
 * Error thrown when creating a triage responsibility fails.
 * Caused by Linear API errors during triage responsibility creation.
 */
export class CreateTriageResponsibilityError extends Data.TaggedError(
  'CreateTriageResponsibilityError'
)<{
  error: LinearError;
  input: CreateTriageResponsibilityOptions;
}> {}

/**
 * Error thrown when updating a triage responsibility fails.
 * Caused by Linear API errors during triage responsibility update.
 */
export class UpdateTriageResponsibilityError extends Data.TaggedError(
  'UpdateTriageResponsibilityError'
)<{
  error: LinearError;
  input: UpdateTriageResponsibilityOptions;
  id: string;
}> {}

/**
 * Error thrown when deleting a triage responsibility fails.
 * Caused by Linear API errors during triage responsibility deletion.
 */
export class DeleteTriageResponsibilityError extends Data.TaggedError(
  'DeleteTriageResponsibilityError'
)<{
  error: LinearError;
  id: string;
}> {}
