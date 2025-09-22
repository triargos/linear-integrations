import {Effect, Schema} from 'effect';
import {CalendarListResponse, EventListResponse} from './calendar-types';
import {handleGraphError, ParseGraphResponseError,} from '../graph/graph-error';
import {DateTime} from 'luxon';
import {GraphClient} from "../graph/graph-client.ts";


export class OutlookCalendarService extends Effect.Service<OutlookCalendarService>()("OutlookCalendarService", {
    dependencies: [GraphClient.Default],
    effect: Effect.gen(function* () {
        const graphClient = yield* GraphClient

        const listCalendarsByEmail = Effect.fn("OutlookCalendarService.listCalendarsByEmail")(function* ({email}: {
            email: string
        }) {
            yield* Effect.annotateCurrentSpan({email})
            const endpoint = `/users/${encodeURIComponent(email)}/calendars`;

            const response = yield* Effect.tryPromise({
                try: () => graphClient.api(endpoint).get(),
                catch: error => handleGraphError(error, endpoint),
            })
            const parsed = yield* Schema.decodeUnknown(CalendarListResponse)(response).pipe(
                Effect.mapError(cause => new ParseGraphResponseError({cause, endpoint}))
            )
            return parsed.value
        })

        const listEventsByEmail = Effect.fn("OutlookCalendarService.listEventsByEmail")(function* ({
                                                                                                       email,
                                                                                                       startDate,
                                                                                                       endDate
                                                                                                   }: {
            email: string,
            startDate?: DateTime,
            endDate?: DateTime
        }) {
            const start = startDate ?? DateTime.now().startOf("day")
            const end = endDate ?? DateTime.now().startOf("day").plus({day: 1})
            yield* Effect.annotateCurrentSpan({
                start,
                end,
                email
            })
            const endpoint = `/users/${encodeURIComponent(email)}/calendarview`;
            const response = yield* Effect.tryPromise({
                try: () =>
                    graphClient
                        .api(endpoint)
                        .query({
                            startDateTime: start.toISODate()!,
                            endDateTime: end.toISODate()!,
                        })
                        .get(),
                catch: error => handleGraphError(error, endpoint),
            });
            const parsed = yield* Schema.decodeUnknown(EventListResponse)(response).pipe(
                Effect.mapError(cause => new ParseGraphResponseError({cause, endpoint}))
            )
            return parsed.value
        })
        return {
            listCalendarsByEmail,
            listEventsByEmail
        } as const

    })
}) {
}
