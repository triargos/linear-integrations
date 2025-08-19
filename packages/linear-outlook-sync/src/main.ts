import { Effect, Layer, Logger, LogLevel, Redacted } from 'effect';
import {
  CalendarService,
  CalendarServiceLive,
} from './calendar/calendar-service';
import { GraphAuthServiceLive } from './auth/graph-auth-service';
import { ConfigurationServiceLive, loadConfig } from './config/config';
import { LinearClient } from '@triargos/effect-linear';
import { HotlineEvent } from './hotline-event/hotline-event-types';
import {
  HotlineEventService,
  HotlineEventServiceLive,
} from './hotline-event/hotline-event-service';
import { DateTime } from 'luxon';

interface CreateOrUpdateTriageResponsibilityOptions {
  teamId: string;
  event: HotlineEvent;
}

const createOrUpdateTriageResponsibility = ({
  teamId,
  event,
}: CreateOrUpdateTriageResponsibilityOptions) =>
  Effect.gen(function* () {
    const linearClient = yield* LinearClient;
    yield* Effect.logInfo(
      `Assigning user ${event.assignedUser.linearUserId} (${event.assignedUser.shortName}) at ${event.date.toLocaleString()}`
    );

    // Try to find existing triage responsibility for team
    const responsibilities = yield* linearClient.triageResponsibility.list();
    const teamResponsibility = responsibilities.find(r => r.teamId === teamId);

    if (teamResponsibility) {
      yield* Effect.logDebug(
        `Found existing triage responsibility ${teamResponsibility.id} for team ${teamId}`
      );
      return yield* linearClient.triageResponsibility.update({
        id: teamResponsibility.id,
        action: 'notify',
        users: [event.assignedUser.linearUserId],
      });
    } else {
      yield* Effect.logDebug(
        `No triage responsibility found for team ${teamId}, creating a new one`
      );
      return yield* linearClient.triageResponsibility.create({
        teamId,
        action: 'notify',
        users: [event.assignedUser.linearUserId],
      });
    }
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
    config.linear.users
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

// Create LinearClient layer with config
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
  Logger.withMinimumLogLevel(LogLevel.Debug)
);

Effect.runPromise(runnable);
