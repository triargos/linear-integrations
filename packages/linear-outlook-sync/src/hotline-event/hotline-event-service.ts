import { Effect } from 'effect';
import { Event } from '../calendar/calendar-types';
import { AssignedUser, HotlineEvent } from './hotline-event-types';
import { isTodayOrFuture, sortEvents } from './hotline-event.utils';
import {
  DetermineAssignedUserError,
  DetermineNextHotlineEventError,
} from './hotline-event-error';
import { DateTime } from 'luxon';

const determineUser = (event: Event, linearUsers: Record<string, string>) =>
  Effect.gen(function* () {
    const userNames = Object.keys(linearUsers).join('|');
    const hotlineRegex = new RegExp(
      `(${userNames})\\s+hotline|hotline\\s+(${userNames})`,
      'i'
    );
    const match = event.subject?.toLowerCase().match(hotlineRegex);
    const userName = match?.[1] || match?.[2];
    if (!userName) {
      return yield* new DetermineAssignedUserError({
        subject: event.subject!,
        userShortNames: Object.keys(linearUsers),
      });
    }
    const userId = linearUsers[userName.toLowerCase()];
    return {
      linearUserId: userId,
      shortName: userName.toLowerCase(),
    } satisfies AssignedUser;
  });

const getNextEvent = (events: readonly Event[]) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(
      `Searching for the next event in ${events.length} events`
    );
    const nextEvent = events
      .filter(isTodayOrFuture)
      .sort(sortEvents)
      .find(event => {
        return event.subject?.toLowerCase().includes('hotline');
      });
    if (!nextEvent) {
      return yield* new DetermineNextHotlineEventError({
        eventSubjects: events.map(ev => ev.subject) as string[],
        date: DateTime.now().startOf('day').toISO(),
      });
    }
    yield* Effect.logDebug(
      `Found event with subject ${nextEvent.subject} at ${DateTime.fromISO(nextEvent.start.dateTime).toISODate()}`
    );
    return nextEvent;
  });

const makeHotlineEventService = Effect.gen(function* () {
  const getNextAssignableHotlineEvent = (
    events: readonly Event[],
    linearUsers: Record<string, string>
  ) =>
    Effect.gen(function* () {
      const nextEvent = yield* getNextEvent(events);
      const assignedUser = yield* determineUser(nextEvent, linearUsers);
      return {
        assignedUser,
        date: DateTime.fromISO(nextEvent.start.dateTime).startOf('day'),
      } satisfies HotlineEvent;
    });
  return { getNextAssignableHotlineEvent } as const;
});

export class HotlineEventService extends Effect.Service<HotlineEventService>()(
  'HotlineEventService',
  {
    effect: makeHotlineEventService,
  }
) {}

export const HotlineEventServiceLive = HotlineEventService.Default;
