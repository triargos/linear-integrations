import {Effect, Layer, Redacted} from 'effect';
import {config} from 'dotenv';

import {ConfigurationService, ConfigurationServiceLive} from './config/config';
import {LinearClient} from '@triargos/effect-linear';
import {HotlineEventService} from './hotline-event/hotline-event-service';
import {OutlookCalendarService} from "./calendar/calendar-service.ts";
import {ObservabilityLive} from "./reporting/sentry.ts";
import {ErrorTracker} from "./reporting/error-tracking.ts";


if (process.env.NODE_ENV !== 'production') {
    config();
}


const program = Effect.gen(function* () {
    const calendarService = yield* OutlookCalendarService
    const configService = yield* ConfigurationService
    const eventService = yield* HotlineEventService
    const linearClient = yield* LinearClient
    const configuration = yield* configService.load

    const nextEvents = yield* calendarService.listEventsByEmail({email: configuration.outlook.calendarEmail})
    const {linearUserId, userName} = yield* eventService.getNextHotlineEvent({
        events: nextEvents,
        eventRegex: new RegExp(configuration.outlook.eventRegex, "i"),
        linearUsers: configuration.linear.users
    })
    yield* Effect.logInfo(`Assigning ${userName} (${linearUserId}) to Hotline Triage...`)
    const existingTriageResponsibility = yield* linearClient.triageResponsibilities.list().pipe(
        Effect.map(responsibilities => responsibilities.find(resp => resp.teamId === configuration.linear.teamId))
    )
    if (!existingTriageResponsibility) {
        yield* Effect.logInfo(`Creating new linear triage responsibility`)
        yield* linearClient.triageResponsibilities.create({
            teamId: configuration.linear.teamId,
            action: "notify",
            users: [linearUserId]
        })
    } else {
        yield* Effect.logInfo(`Updating existing triage responsibility (${existingTriageResponsibility.id}`)
        yield* linearClient.triageResponsibilities.update({
            id: existingTriageResponsibility.id,
            action: "notify",
            users: [linearUserId]
        })
    }
}).pipe(
    Effect.withSpan("run_outlook_sync")
)


const LinearLayer = Layer.unwrapEffect(Effect.gen(function* () {
    const configService = yield* ConfigurationService
    const config = yield* configService.load
    return LinearClient.layer({apiKey: Redacted.make(config.linear.auth.apiKey)})
}))


const BaseLayer = Layer.mergeAll(
    OutlookCalendarService.Default,
    HotlineEventService.Default,
    LinearLayer,
    ObservabilityLive
)


const AppLayer = Layer.provideMerge(BaseLayer, ConfigurationServiceLive);
const runnable = program.pipe(
    Effect.tapError((error) =>
        Effect.gen(function* () {
            const errorTracker = yield* ErrorTracker;
            yield* errorTracker.captureException(error);
        }),
    ),
    Effect.scoped,
    Effect.provide(AppLayer),
);

export function runOutlookSync() {
   return Effect.runPromiseExit(runnable);
}


