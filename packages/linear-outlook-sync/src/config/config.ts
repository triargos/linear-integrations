import {Config, Effect} from 'effect';
import {ConfigSchema, InvalidConfigurationError} from './config-types';
import {hashMapToRecord} from '../utils/hashmap-to-record.ts';

const appConfig = Config.all({
    reporting: Config.all({
        sentryDsn: Config.string("REPORTING_SENTRY_DSN")
    }),
  linear: Config.all({
    users: Config.hashMap(Config.string(), 'USERS').pipe(
      Config.map(hashMapToRecord)
    ),
    auth: Config.all({
      apiKey: Config.string('LINEAR_AUTH_API_KEY'),
    }),
    teamId: Config.string('LINEAR_TEAM_ID'),
  }),
  outlook: Config.all({
    calendarEmail: Config.string('OUTLOOK_CALENDAR_EMAIL'),
    eventRegex: Config.string('OUTLOOK_EVENT_REGEX'),
    auth: Config.all({
      tenantId: Config.string('OUTLOOK_AUTH_TENANT_ID'),
      clientId: Config.string('OUTLOOK_AUTH_CLIENT_ID'),
      clientSecret: Config.string('OUTLOOK_AUTH_CLIENT_SECRET'),
    }),
  }),
});

export class ConfigurationService extends Effect.Service<ConfigurationService>()(
  'ConfigurationService',
  {
    effect: Effect.gen(function* () {
      const load = Effect.gen(function* () {
        const config = yield* appConfig.pipe(
          Effect.mapError(
            error =>
              new InvalidConfigurationError({
                message: `Failed to load config from environment: ${error.message}`,
              })
          )
        );
        return config satisfies ConfigSchema;
      });
      return { load };
    }),
  }
) {}

export const loadConfig = Effect.gen(function* () {
  const configService = yield* ConfigurationService;
  return yield* configService.load;
});

export const ConfigurationServiceLive = ConfigurationService.Default;
