import { Effect, Layer } from 'effect';
import { LinearTriageResponsibilities } from './modules/triage-responsibilities/triage-responsibilities-service.ts';
import {
  LinearClientOptions,
  LinearClientWrapper,
} from './internal/client-wrapper.ts';

/**
 * Linear client service that provides access to Linear API functionality in an effectful way
 *
 * @example Using layerConfig (requires `LINEAR_API_KEY` environment variable)
 * ```typescript
 * import { LinearClient } from "@triargos/effect-linear";
 * import { Effect } from "effect";
 *
 * // Set environment variable: `LINEAR_API_KEY=your_api_key_here`
 * const program = Effect.gen(function* () {
 *   const client = yield* LinearClient;
 *   return client.triageResponsibilities;
 * });
 *
 * const runnable = Effect.provide(program, LinearClient.layerConfig());
 * ```
 *
 * @example Using layer with explicit API key
 * ```typescript
 * import { LinearClient } from "@triargos/effect-linear";
 * import { Effect, Redacted } from "effect";
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* LinearClient;
 *   const triageResponsibilities = yield* client.triageResponsibilities.list()
 * });
 *
 * const runnable = Effect.provide(
 *   program,
 *   LinearClient.layer({ apiKey: Redacted.make("your_api_key_here") })
 * );
 * ```
 *
 * @example Triage usage
 * ```typescript
 * import { LinearClient } from "@triargos/effect-linear";
 * import { Effect } from "effect";
 *
 * const triageProgram = Effect.gen(function* () {
 *   const client = yield* LinearClient;
 *   const triageResponsibilities = yield* client.triageResponsibilities.list();
 *   return triageResponsibilities;
 * });
 * ```
 */
export class LinearClient extends Effect.Service<LinearClient>()(
  'LinearClient',
  {
    dependencies: [LinearTriageResponsibilities.Default],
    effect: Effect.gen(function* () {
      const triageResponsibilities = yield* LinearTriageResponsibilities;
      return { triageResponsibilities } as const;
    }),
  }
) {
  /**
   * Creates a LinearClient layer using configuration from environment variables.
   *
   * @description Requires the `LINEAR_API_KEY` environment variable to be set.
   * @returns A Layer that provides **LinearClient**
   */
  static layerConfig() {
    return Layer.provideMerge(
      LinearClient.Default,
      LinearClientWrapper.layerConfig()
    );
  }

  /**
   * Creates a LinearClient layer with an explicit API key.
   *
   * @param options - Configuration options including the API key
   * @returns A Layer that provides **LinearClient**
   */
  static layer({ apiKey }: LinearClientOptions) {
    return Layer.provideMerge(
      LinearClient.Default,
      LinearClientWrapper.Default({ apiKey })
    );
  }
}
