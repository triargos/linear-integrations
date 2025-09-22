import {Effect} from 'effect';
import {Event} from '../calendar/calendar-types';
import {DetermineHotlineUserError, MissingHotlineEventError,} from './hotline-event-error';
import {DateTime} from 'luxon';

interface GetNextHotlineEventOptions {
    events: readonly Event[]
    linearUsers: Record<string, string>
    eventRegex: RegExp
}

//Functions to filter events
function isToday(event: Event) {
    const now = DateTime.now().startOf("day")
    const eventDate = DateTime.fromISO(event.start.dateTime).startOf("day")
    return now.equals(eventDate)
}

function sortEvents(a: Event, b: Event) {
    const aDate = DateTime.fromISO(a.start.dateTime);
    const bDate = DateTime.fromISO(b.start.dateTime);
    return aDate.toMillis() - bDate.toMillis();
}


export class HotlineEventService extends Effect.Service<HotlineEventService>()("HotlineEventService", {
    effect: Effect.gen(function* () {

        const getNextHotlineEvent = Effect.fn("HotlineEventService.getNextHotlineEvent")(function* ({
                                                                                                        events,
                                                                                                        eventRegex,
                                                                                                        linearUsers
                                                                                                    }: GetNextHotlineEventOptions) {
            yield* Effect.annotateCurrentSpan({
                events: events.length,
                eventRegex
            })
            const nextEvent = events.filter(isToday).sort(sortEvents).find(event => event.subject && eventRegex.test(event.subject))
            if (!nextEvent) {
                return yield* new MissingHotlineEventError({
                    eventSubjects: events.map(event => event.subject!),
                    date: DateTime.now().toJSDate()
                })
            }
            const userShortNames = Object.keys(linearUsers).map(name => name.toLowerCase())
            const userShortNameRegex = userShortNames.join("|")

            const regex = new RegExp(`(${userShortNameRegex}).*?(?:${eventRegex.source})|(?:${eventRegex.source}).*?(${userShortNameRegex})`, "i")
            const match = nextEvent.subject?.toLowerCase().match(regex)
            const userName = (match?.[1] || match?.[2])?.toLowerCase();
            if (!userName) {
                return yield* new DetermineHotlineUserError({
                    userNames: userShortNames,
                    eventSubject: nextEvent.subject?.toLowerCase()!,
                    regex: regex.source
                })
            }
            const userId = linearUsers[userName.toUpperCase()]
            yield* Effect.annotateCurrentSpan({userId, userName})
            return {linearUserId: userId, userName}
        })

        return {getNextHotlineEvent} as const
    })
}) {
}
