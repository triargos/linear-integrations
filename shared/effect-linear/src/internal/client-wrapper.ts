import { LinearClient as OriginalLinearClient } from '@linear/sdk';
import { Config, Effect, Layer, Redacted } from 'effect';
import { handleLinearError, LinearError } from './error.ts';

interface LinearClientDefinition {
  use: <T>(
    fn: (client: OriginalLinearClient) => T | Promise<T>
  ) => Effect.Effect<T, LinearError, never>;
}

export interface LinearClientOptions {
  apiKey: Redacted.Redacted;
}

export class LinearClientWrapper extends Effect.Service<LinearClientWrapper>()(
  'LinearClientWrapper',
  {
    scoped: Effect.fnUntraced(function* (opts: LinearClientOptions) {
      const linearClient = new OriginalLinearClient({
        apiKey: Redacted.value(opts.apiKey),
      });
      return {
        use: fn =>
          Effect.gen(function* () {
            const initialResult = yield* Effect.try({
              try: () => fn(linearClient),
              catch: handleLinearError,
            });
            if (initialResult instanceof Promise) {
              return yield* Effect.tryPromise({
                try: () => initialResult,
                catch: handleLinearError,
              });
            }
            return initialResult;
          }),
      } satisfies LinearClientDefinition;
    }),
  }
) {
  static layerConfig() {
    return Layer.unwrapEffect(
      Effect.gen(function* () {
        const apiKey = yield* Config.redacted('LINEAR_API_KEY');
        return LinearClientWrapper.Default({ apiKey });
      })
    );
  }
}
