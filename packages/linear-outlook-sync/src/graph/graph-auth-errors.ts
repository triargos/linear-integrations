import {Schema} from 'effect';

export class GraphAuthInitializationError extends Schema.TaggedError<GraphAuthInitializationError>()("GraphAuthInitializationError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
}) {
}

export class GraphTokenAcquisitionError extends Schema.TaggedError<GraphTokenAcquisitionError>()("GraphTokenAcquisitionError", {
    message: Schema.String,
    errorCode: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
}) {
}

export class GraphClientInitializationError extends Schema.TaggedError<GraphClientInitializationError>()("GraphClientInitializationError", {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
}) {
}
