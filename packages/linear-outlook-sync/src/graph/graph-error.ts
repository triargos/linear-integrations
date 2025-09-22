import {Effect, Either, Schema} from 'effect';
import {GraphError} from '@microsoft/microsoft-graph-client';
import {ParseError} from "effect/ParseResult";

const GraphErrorBodySchema = Schema.Struct({
    code: Schema.String,
    message: Schema.String,
});

export const handleGraphError = (error: unknown, endpoint: string) => {
    if (error instanceof GraphError) {
        const decodeResult = Effect.runSync(
            Schema.decodeUnknown(GraphErrorBodySchema)(error.body).pipe(Effect.either)
        );

        if (Either.isRight(decodeResult)) {
            const {code, message} = decodeResult.right;

            switch (error.statusCode) {
                case 400:
                    return new GraphBadRequestError({endpoint, code, message});
                case 401:
                    return new GraphUnauthorizedError({endpoint, code, message});
                case 403:
                    return new GraphPermissionError({endpoint, code, message});
                case 404:
                    return new GraphEndpointNotFoundError({endpoint, code, message});
                case 429:
                    return new GraphRateLimitError({endpoint, code, message});
                default:
                    return new GraphGenericError({
                        endpoint,
                        code,
                        message,
                        statusCode: error.statusCode,
                    });
            }
        } else {
            // Parsing failed, return InvalidGraphResponseError
            return new InvalidGraphResponseError({
                endpoint,
                code: 'PARSE_ERROR',
                message: `Failed to parse graph error response: ${decodeResult.left.message}`,
            });
        }
    } else {
        // Not a GraphError instance, create a generic error
        const message = error instanceof Error ? error.message : String(error);
        return new GraphGenericError({
            endpoint,
            code: 'UNKNOWN',
            message,
            statusCode: 500,
        });
    }
};

const GraphErrorSchema = Schema.Struct({
    endpoint: Schema.String,
    code: Schema.String,
    message: Schema.String,
})



export class GraphEndpointNotFoundError extends Schema.TaggedError<GraphEndpointNotFoundError>()("GraphEndpointNotFoundError", {
    ...GraphErrorSchema.fields
}) {
}

export class GraphPermissionError extends Schema.TaggedError<GraphPermissionError>()("GraphPermissionError", {
    ...GraphErrorSchema.fields
}) {
}

export class GraphUnauthorizedError extends Schema.TaggedError<GraphUnauthorizedError>()("GraphUnauthorizedError", {
    ...GraphErrorSchema.fields
}) {
}

export class GraphRateLimitError extends Schema.TaggedError<GraphRateLimitError>()("GraphRateLimitError", {
    ...GraphErrorSchema.fields
}) {
}

export class GraphBadRequestError extends Schema.TaggedError<GraphBadRequestError>()("GraphBadRequestError", {
    ...GraphErrorSchema.fields
}) {
}

export class InvalidGraphResponseError extends Schema.TaggedError<InvalidGraphResponseError>()("InvalidGraphResponseError", {
    ...GraphErrorSchema.fields
}) {
}

export class GraphGenericError extends Schema.TaggedError<GraphGenericError>()("GraphGenericError", {
    endpoint: Schema.String,
    code: Schema.String,
    message: Schema.String,
    statusCode: Schema.Number,
}) {
}

export class ParseGraphResponseError extends Schema.TaggedError<ParseGraphResponseError>()("ParseGraphResponseError", {
    endpoint: Schema.String,
    cause: Schema.instanceOf(ParseError)

}) {
}
