import { Data } from 'effect';

export class DetermineNextHotlineEventError extends Data.TaggedError(
  'DetermineNextHotlineEventError'
)<{
  eventSubjects: string[];
  date: string;
}> {}

export class DetermineUserFromEventError extends Data.TaggedError(
  'DetermineUserFromEventError'
)<{
  subject: string;
  mappedUserNames: string[];
}> {}
