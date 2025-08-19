import { Effect, Schema } from 'effect';
import {
  GraphAuthService,
  GraphAuthServiceLive,
} from '../auth/graph-auth-service';
import { CalendarListResponse, EventListResponse } from './calendar-types';
import {
  handleGraphError,
  parseGraphResponseError,
} from '../graph/graph-error';
import { DateTime } from 'luxon';
import { ConfigurationServiceLive } from '../config/config';

const makeCalendarService = Effect.gen(function* () {
  const authService = yield* GraphAuthService;
  const listCalendars = (email: string) =>
    Effect.gen(function* () {
      const graphClient = yield* authService.getGraphClient;
      const endpoint = `/users/${encodeURIComponent(email)}/calendars`;

      const response = yield* Effect.tryPromise({
        try: () => graphClient.api(endpoint).get(),
        catch: error => handleGraphError(error, endpoint),
      });

      const parsedResponse = yield* Schema.decodeUnknown(CalendarListResponse)(
        response
      ).pipe(
        Effect.mapError(error =>
          parseGraphResponseError(endpoint, response, error.message)
        )
      );

      return parsedResponse.value;
    });

  /**
   * Lists calendar events for a user within a date range
   * @param options - Configuration object
   * @param options.email - User email address
   * @param options.start - Start date (defaults to today)
   * @param options.end - End date (defaults to today + 7 days)
   * @returns Array of events within the specified date range
   */
  const listEvents = (options: {
    email: string;
    start?: DateTime;
    end?: DateTime;
  }) =>
    Effect.gen(function* () {
      const graphClient = yield* authService.getGraphClient;
      const { email, end, start } = options;
      const startDate = start ?? DateTime.now();
      const endDate = end ?? DateTime.now().plus({ day: 7 });

      const endpoint = `/users/${encodeURIComponent(email)}/calendarview`;
      const response = yield* Effect.tryPromise({
        try: () =>
          graphClient
            .api(endpoint)
            .query({
              startDateTime: startDate.toISODate()!,
              endDateTime: endDate.toISODate()!,
            })
            .get(),
        catch: error => handleGraphError(error, endpoint),
      });

      const parsedResponse = yield* Schema.decodeUnknown(EventListResponse)(
        response
      ).pipe(
        Effect.mapError(error =>
          parseGraphResponseError(endpoint, response, error.message)
        )
      );

      return parsedResponse.value;
    });

  return {
    listCalendars,
    listEvents,
  };
});

export class CalendarService extends Effect.Service<CalendarService>()(
  'CalendarService',
  {
    effect: makeCalendarService,
    dependencies: [GraphAuthServiceLive, ConfigurationServiceLive],
  }
) {}

export const CalendarServiceLive = CalendarService.Default;
