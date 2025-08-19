import {Data, Schema, Effect, Either} from "effect";
import {GraphError} from "@microsoft/microsoft-graph-client";


const GraphErrorBodySchema = Schema.Struct({
    code: Schema.String,
    message: Schema.String
})

export const handleGraphError = (error: unknown, endpoint: string) => {
    if (error instanceof GraphError) {
        const decodeResult = Effect.runSync(
            Schema.decodeUnknown(GraphErrorBodySchema)(error.body).pipe(
                Effect.either
            )
        );
        
        if (Either.isRight(decodeResult)) {
            const { code, message } = decodeResult.right;
            
            switch (error.statusCode) {
                case 400:
                    return new GraphBadRequestError({ endpoint, code, message });
                case 401:
                    return new GraphUnauthorizedError({ endpoint, code, message });
                case 403:
                    return new GraphPermissionError({ endpoint, code, message });
                case 404:
                    return new GraphEndpointNotFoundError({ endpoint, code, message });
                case 429:
                    return new GraphRateLimitError({ endpoint, code, message });
                default:
                    return new GraphGenericError({ endpoint, code, message, statusCode: error.statusCode });
            }
        } else {
            // Parsing failed, return InvalidGraphResponseError
            return new InvalidGraphResponseError({
                endpoint,
                code: "PARSE_ERROR",
                message: `Failed to parse graph error response: ${decodeResult.left.message}`
            });
        }
    } else {
        // Not a GraphError instance, create a generic error
        const message = error instanceof Error ? error.message : String(error);
        return new GraphGenericError({ 
            endpoint, 
            code: "UNKNOWN", 
            message,
            statusCode: 500 
        });
    }
}

interface BaseErrorProps {
    endpoint: string
    code: string
    message: string
}

export class GraphEndpointNotFoundError extends Data.TaggedError("GraphEndpointNotFoundError")<BaseErrorProps> {

}

export class GraphPermissionError extends Data.TaggedError("GraphPermissionError")<BaseErrorProps> {

}

export class GraphUnauthorizedError extends Data.TaggedError("GraphUnauthorizedError")<BaseErrorProps> {

}

export class GraphRateLimitError extends Data.TaggedError("GraphRateLimitError")<BaseErrorProps> {

}

export class GraphBadRequestError extends Data.TaggedError("GraphBadRequestError")<BaseErrorProps> {

}

export class InvalidGraphResponseError extends Data.TaggedError("InvalidGraphResponseError")<BaseErrorProps> {

}

interface GenericErrorProps extends BaseErrorProps {
    statusCode: number
}

export class GraphGenericError extends Data.TaggedError("GraphGenericError")<GenericErrorProps> {

}

export class GraphParseError extends Data.TaggedError("GraphParseError")<{
    readonly endpoint: string
    readonly message: string
    readonly responseData?: unknown
    readonly parseError?: string
}> {}

export const parseGraphResponseError = (endpoint: string, responseData: unknown, parseError: string) => 
    new GraphParseError({
        endpoint,
        message: `Failed to parse Graph response from ${endpoint}: ${parseError}`,
        responseData,
        parseError
    })