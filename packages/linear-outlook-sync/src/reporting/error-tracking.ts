import {Cause, Effect} from "effect";
import * as Sentry from "@sentry/node";
export class ErrorTracker extends Effect.Service<ErrorTracker>()("ErrorTracker", {
    effect: Effect.gen(function* (){
        const captureException = (error: Cause.YieldableError) =>
            Effect.gen(function* () {
                let jsonError;
                try {
                    jsonError = error.toJSON();
                } catch {
                    jsonError = error.toString();
                }
                yield* Effect.logInfo("Capturing error...")
                yield* Effect.logError(error.message, {
                    error: jsonError,
                });
                yield* Effect.try(async () => {
                    const scope = Sentry.getCurrentScope();
                    Sentry.captureException(error, scope);
                });
            });

        return { captureException };


    })
}) {}