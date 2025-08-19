import {Data, Effect, Schema} from "effect";

export class InvalidConfigurationError extends Data.TaggedError("InvalidConfigurationError")<{
    message: string
}> {
}

const linearConfigSchema = Schema.Struct({
    auth: Schema.Struct({
        apiKey: Schema.String
    }),
    teamId: Schema.String,
    users: Schema.Record({
        key: Schema.String.pipe(Schema.minLength(2)),
        value: Schema.String
    })
})

const outlookConfigSchema = Schema.Struct({
    calendarEmail: Schema.String,
    auth: Schema.Struct({
        tenantId: Schema.String,
        clientId: Schema.String,
        clientSecret: Schema.String
    })
})

export const configSchema = Schema.Struct({
    linear: linearConfigSchema,
    outlook: outlookConfigSchema
})
export type ConfigSchema = Schema.Schema.Type<typeof configSchema>

export interface IConfigService {
    load: Effect.Effect<ConfigSchema, InvalidConfigurationError>
}