import { Data, Effect, Schema } from 'effect';

export class InvalidConfigurationError extends Data.TaggedError(
  'InvalidConfigurationError'
)<{
  message: string;
}> {}

export const linearUsersSchema = Schema.Record({
  key: Schema.String.pipe(Schema.minLength(2)),
  value: Schema.String,
});

const linearConfigSchema = Schema.Struct({
  auth: Schema.Struct({
    apiKey: Schema.String,
  }),
  teamId: Schema.String,
  users: linearUsersSchema,
});

const outlookConfigSchema = Schema.Struct({
  calendarEmail: Schema.String,
  eventRegex: Schema.String,
  auth: Schema.Struct({
    tenantId: Schema.String,
    clientId: Schema.String,
    clientSecret: Schema.String,
  }),
});

export const configSchema = Schema.Struct({
  linear: linearConfigSchema,
  outlook: outlookConfigSchema,
});
export type ConfigSchema = Schema.Schema.Type<typeof configSchema>;

export interface IConfigService {
  load: Effect.Effect<ConfigSchema, InvalidConfigurationError>;
}
