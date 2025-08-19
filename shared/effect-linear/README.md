# @triargos/effect-linear

> ⚠️ **Work in Progress** - This package is nowhere near complete and things are still changing rapidly. APIs may break without notice.

An Effect-based TypeScript client for the Linear API, providing type-safe and composable operations.

## Installation

```bash
npm install @triargos/effect-linear effect
# or
pnpm add @triargos/effect-linear effect
# or
yarn add @triargos/effect-linear effect
```

## Basic Usage

### Environment Configuration

This package uses the Effect config system to manage the Linear API key. By default, the environment config provider is used, but any config provider that provides a `LINEAR_API_KEY` will work.

Set your Linear API key as an environment variable:

```bash
export LINEAR_API_KEY="your_api_key_here"
```

### Simple Example

```typescript
import { LinearClient } from "@triargos/effect-linear";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const client = yield* LinearClient;
  const triageResponsibilities = yield* client.triageResponsibilities.list();
  console.log(`Found ${triageResponsibilities.length} triage responsibilities`);
  return triageResponsibilities;
});

const runnable = Effect.provide(program, LinearClient.layerConfig());
Effect.runPromise(runnable);
```

### Using Explicit API Key

Use this approach when your API key comes from somewhere other than environment variables (e.g., a configuration file, database, or secrets manager).

```typescript
import { LinearClient } from "@triargos/effect-linear";
import { Effect, Redacted } from "effect";

const program = Effect.gen(function* () {
  const client = yield* LinearClient;
  const responsibilities = yield* client.triageResponsibilities.list();
  return responsibilities;
});

const runnable = Effect.provide(
  program,
  LinearClient.layer({ apiKey: Redacted.make("your_api_key_here") })
);

Effect.runPromise(runnable);
```

### Reading API Key from Configuration File

```typescript
import { LinearClient } from "@triargos/effect-linear";
import { Effect, Layer, Redacted, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";

const ConfigSchema = Schema.Struct({
  linearApiKey: Schema.String,
});

const ConfigLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    
    const configContent = yield* fs.readFileString("config.json");
    const config = yield* Schema.decodeUnknown(
      Schema.parseJson(ConfigSchema)
    )(configContent);
    
    return LinearClient.layer({ 
      apiKey: Redacted.make(config.linearApiKey) 
    });
  })
).pipe(Layer.provide(NodeFileSystem.layer));

const program = Effect.gen(function* () {
  const client = yield* LinearClient;
  const responsibilities = yield* client.triageResponsibilities.list();
  return responsibilities;
});

const runnable = Effect.provide(program, ConfigLayer);
Effect.runPromise(runnable);
```

## Error Handling

This package returns wrapped errors that enhance the base Linear API errors with additional context (such as operation-specific IDs, team IDs, or input parameters). This provides better debugging information and error traceability.

If you need to access the underlying Linear API error (for example, to handle specific error types like rate limits or authentication failures), use the `getLinearErrorCause` helper:

```typescript
import { LinearClient } from "@triargos/effect-linear";
import { 
  LinearAuthenticationError,
  LinearRateLimitError,
  getLinearErrorCause
} from "@triargos/effect-linear/errors";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const client = yield* LinearClient;
  return yield* client.triageResponsibilities.list();
});

// Handle specific Linear API error types with catchTag
const safeProgram = program.pipe(
  Effect.mapError(getLinearErrorCause),
  Effect.catchTag("LinearRateLimitError", (error) => {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
    return Effect.succeed([]);
  }),
  Effect.catchTag("LinearAuthenticationError", (error) => {
    console.error("Authentication failed:", error.message);
    return Effect.succeed([]);
  })
);

const runnable = Effect.provide(safeProgram, LinearClient.layerConfig());
```


## Error Types

The package exports various error types for different scenarios:

- `LinearAuthenticationError` - API key issues
- `LinearForbiddenError` - If the permission is denied or the user does not have access to a specific feature
- `LinearInternalError` - Internal or unknown errors that can occur
- `LinearInvalidInputError` - Invalid request parameters
- `LinearRateLimitError` - Rate limiting

## Development Status

This package is in early development. Current features:

- ✅ Basic Linear client setup
- ✅ Triage responsibility management
- ❌ Issue management (planned)
- ❌ Project management (planned)
- ❌ Comment management (planned)
- ❌ Webhook support (planned)

## Contributing

This is a work-in-progress package. APIs are subject to change without notice until we reach a stable release.