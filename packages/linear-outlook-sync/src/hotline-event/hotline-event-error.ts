import { Data } from 'effect';

export class DetermineNextHotlineEventError extends Data.TaggedError(
  'DetermineNextHotlineEventError'
)<{
  eventSubjects: string[];
  date: string;
}> {}

export class DetermineAssignedUserError extends Data.TaggedError(
  'DetermineAssignedUserError'
)<{
  subject: string;
  userShortNames: string[];
}> {}
