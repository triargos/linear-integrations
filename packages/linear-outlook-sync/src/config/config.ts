import {Effect, Ref, Schema} from "effect";
import {FileSystem} from "@effect/platform";
import {NodeFileSystem} from "@effect/platform-node";
import {ConfigSchema, configSchema, InvalidConfigurationError} from "./config-types";


export class ConfigurationService extends Effect.Service<ConfigurationService>()("ConfigurationService", {
    effect: Effect.gen(function* () {
        const configRef = yield* Ref.make<ConfigSchema | null>(null)

        const fs = yield* FileSystem.FileSystem;
        const load = Effect.gen(function* () {
            const cachedValue = yield* configRef.get
            if (cachedValue !== null) {
                yield* Effect.logDebug("Using cached configuration")
                return cachedValue
            }
            const configPath = "config.json";
            yield* Effect.logDebug("Reading configuration file")
            const configContent = yield* fs.readFileString(configPath).pipe(
                Effect.mapError(error => new InvalidConfigurationError({
                    message: `Failed to read config file: ${error}`
                }))
            );
            yield* Effect.logDebug("Parsing configuration content")
            const parsedConfig = yield* Schema.decodeUnknown(Schema.parseJson(configSchema))(configContent).pipe(Effect.mapError(error => new InvalidConfigurationError({
                message: `Failed to parse config: ${error.message}`
            })))
            yield* Effect.logDebug("Setting configuration to cache")
            yield* Ref.set(configRef, parsedConfig)
            return parsedConfig
        })
        return {load};
    }),
    dependencies: [NodeFileSystem.layer]
}) {
}


export const loadConfig = Effect.gen(function* () {
    const configService = yield* ConfigurationService;
    return yield* configService.load;
})

export const ConfigurationServiceLive = ConfigurationService.Default