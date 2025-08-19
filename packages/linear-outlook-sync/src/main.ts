import { Effect, Layer, Logger, LogLevel, Redacted } from 'effect';
import { config } from 'dotenv';
import { DateTime } from 'luxon';

import { CalendarService, CalendarServiceLive } from './calendar/calendar-service';
import { GraphAuthServiceLive } from './auth/graph-auth-service';
import { ConfigurationServiceLive, loadConfig } from './config/config';
import { LinearClient } from '@triargos/effect-linear';
import { HotlineEvent } from './hotline-event/hotline-event-types';
import { HotlineEventService, HotlineEventServiceLive } from './hotline-event/hotline-event-service';

interface CreateOrUpdateTriageResponsibilityOptions {
  teamId: string;
  event: HotlineEvent;
}

if (process.env.NODE_ENV !== 'production') {
  config();
}

const createOrUpdateTriageResponsibility = ({ teamId, event }: CreateOrUpdateTriageResponsibilityOptions) =>
  Effect.gen(function* () {
    const linearClient = yield* LinearClient;
    yield* Effect.logInfo(
      `Assigning user ${event.assignedUser.linearUserId} (${event.assignedUser.shortName}) at ${event.date.toLocaleString()}`
    );

    const responsibilities = yield* linearClient.triageResponsibilities.list();
    const teamResponsibility = responsibilities.find(r => r.teamId === teamId);

    if (teamResponsibility) {
      yield* Effect.logDebug(
        `Found existing triage responsibility ${teamResponsibility.id} for team ${teamId}`
      );
      return yield* linearClient.triageResponsibilities.update({
        id: teamResponsibility.id,
        action: 'notify',
        users: [event.assignedUser.linearUserId],
      });
    }

    yield* Effect.logDebug(
      `No triage responsibility found for team ${teamId}, creating a new one`
    );
    return yield* linearClient.triageResponsibilities.create({
      teamId,
      action: 'notify',
      users: [event.assignedUser.linearUserId],
    });
  });

const program = Effect.gen(function* () {
  const calendarService = yield* CalendarService;
  const config = yield* loadConfig;
  const events = yield* calendarService.listEvents({
    email: config.outlook.calendarEmail,
  });
  const eventService = yield* HotlineEventService;
  const hotlineEvent = yield* eventService.getNextAssignableHotlineEvent(
    events,
    config.linear.users,
    config.outlook.eventRegex
  );

  const isToday = hotlineEvent.date.equals(DateTime.now().startOf('day'));
  if (!isToday) {
    return yield* Effect.logInfo(
      `Nothing to assign today. Next event at ${hotlineEvent.date.toLocaleString()}`
    );
  }

  return yield* createOrUpdateTriageResponsibility({
    teamId: config.linear.teamId,
    event: hotlineEvent,
  });
});

const LinearClientLayer = Effect.gen(function* () {
  const config = yield* loadConfig;
  return LinearClient.layer({
    apiKey: Redacted.make(config.linear.auth.apiKey),
  });
}).pipe(Layer.unwrapEffect);

const BaseLayer = Layer.mergeAll(
  CalendarServiceLive,
  GraphAuthServiceLive,
  HotlineEventServiceLive,
  LinearClientLayer
);

const AppLayer = Layer.provideMerge(BaseLayer, ConfigurationServiceLive);
const runnable = program.pipe(
  Effect.provide(AppLayer),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.tapError(Effect.logError)
);

Effect.runPromise(runnable);
