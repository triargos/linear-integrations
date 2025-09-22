import * as Sentry from "@sentry/node";
import {Effect, Layer} from "effect";
import {ConfigurationService} from "../config/config.ts";
import * as SentryOpenTelemetry from "@sentry/opentelemetry";
import {OTLPTraceExporter} from "@opentelemetry/exporter-trace-otlp-http";
import {NodeSdk} from "@effect/opentelemetry";
import {ErrorTracker} from "./error-tracking.ts";


const defaultSentryClient = Effect.gen(function* () {
    const configService = yield* ConfigurationService
    const config = yield* configService.load
    yield* Effect.addFinalizer(() => Effect.promise(() => Sentry.flush()))
    return Sentry.init({
        dsn: config.reporting.sentryDsn,
        environment: "production",
        integrations: [
            Sentry.extraErrorDataIntegration({
                captureErrorCause: true,
                depth: 10,
            }),
        ],
        maxValueLength: 5_000,
        normalizeDepth: 10,
        normalizeMaxBreadth: 5_000,
        tracesSampleRate: 1.0,
    })!

})

export class SentryNodeClient extends Effect.Tag("SentryNodeClient")<
    SentryNodeClient,
    Sentry.NodeClient
>() {
    static Default = Layer.scoped(this, defaultSentryClient);
}

export const sentry = Effect.gen(function* () {
    const sentryClient = yield* SentryNodeClient;
    SentryOpenTelemetry.setupEventContextTrace(sentryClient);
    return {
        resource: {
            serviceName: "effect-sentry",
        },
        sampler: new SentryOpenTelemetry.SentrySampler(sentryClient),
        spanProcessor: [new SentryOpenTelemetry.SentrySpanProcessor()],
        textMapPropagator: new SentryOpenTelemetry.SentryPropagator(),
        traceExporter: new OTLPTraceExporter(),
    };
});

export const ObservabilityLive = Layer.mergeAll(
    Layer.provideMerge(
        NodeSdk.layer(sentry),
        SentryNodeClient.Default
    ),
    ErrorTracker.Default
)