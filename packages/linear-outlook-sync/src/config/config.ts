import { Config, Effect, HashMap } from 'effect';
import { ConfigSchema, InvalidConfigurationError } from './config-types';
import { hashMapToRecord } from '../utils/hashmap-to-record.ts';

const appConfig = Config.all({
  linear: Config.all({
    users: Config.hashMap(Config.string(), 'LINEAR.USERS').pipe(
      Config.map(hashMapToRecord)
    ),
    auth: Config.all({
      apiKey: Config.string('LINEAR.AUTH.API_KEY'),
    }),
    teamId: Config.string('LINEAR.TEAM_ID'),
  }),
  outlook: Config.all({
    calendarEmail: Config.string('OUTLOOK.CALENDAR_EMAIL'),
    eventRegex: Config.string('OUTLOOK.EVENT_REGEX'),
    auth: Config.all({
      tenantId: Config.string('OUTLOOK.AUTH.TENANT_ID'),
      clientId: Config.string('OUTLOOK.AUTH.CLIENT_ID'),
      clientSecret: Config.string('OUTLOOK.AUTH.CLIENT_SECRET'),
    }),
  }),
});

export class ConfigurationService extends Effect.Service<ConfigurationService>()(
  'ConfigurationService',
  {
    effect: Effect.gen(function* () {
      const load = Effect.gen(function* () {
        yield* Effect.logDebug(
          'Loading configuration from environment variables'
        );
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
