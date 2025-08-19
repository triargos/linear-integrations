import { Effect } from 'effect';
import { Event } from '../calendar/calendar-types';
import { AssignedUser, HotlineEvent } from './hotline-event-types';
import { isTodayOrFuture, sortEvents } from './hotline-event.utils';
import {
  DetermineUserFromEventError,
  DetermineNextHotlineEventError,
} from './hotline-event-error';
import { DateTime } from 'luxon';

const determineUser = (
  event: Event,
  linearUsers: Record<string, string>,
  eventRegex: string
) =>
  Effect.gen(function* () {
    const lowerLinearUsers = Object.entries(linearUsers).reduce(
      (rec, entry) => {
        const [key, value] = entry;
        rec[key.toLowerCase()] = value;
        return rec;
      },
      {} as Record<string, string>
    );

    const userNames = Object.keys(lowerLinearUsers).join('|');
    const hotlineRegex = new RegExp(
      `(${userNames}).*?(?:${eventRegex})|(?:${eventRegex}).*?(${userNames})`,
      'i'
    );
    const subjectToMatch = event.subject?.toLowerCase();

    const match = subjectToMatch?.match(hotlineRegex);
    const userName = (match?.[1] || match?.[2])?.toLowerCase();
    if (!userName) {
      return yield* new DetermineUserFromEventError({
        subject: subjectToMatch!,
        mappedUserNames: Object.keys(lowerLinearUsers),
      });
    }
    const userId = lowerLinearUsers[userName];
    return {
      linearUserId: userId,
      shortName: userName,
    } satisfies AssignedUser;
  });

const getNextEvent = (events: readonly Event[], eventRegex: string) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(
      `Searching for the next event in ${events.length} events`
    );
    const regex = new RegExp(eventRegex, 'i');
    const nextEvent = events
      .filter(isTodayOrFuture)
      .sort(sortEvents)
      .find(event => {
        return event.subject && regex.test(event.subject);
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
    linearUsers: Record<string, string>,
    eventRegex: string
  ) =>
    Effect.gen(function* () {
      const nextEvent = yield* getNextEvent(events, eventRegex);
      const assignedUser = yield* determineUser(
        nextEvent,
        linearUsers,
        eventRegex
      );
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
    dependencies: [],
  }
) {}

export const HotlineEventServiceLive = HotlineEventService.Default;
export const HotlineEventServiceTest = HotlineEventService.Default;
