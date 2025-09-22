import {Schema} from 'effect';


export class MissingHotlineEventError extends Schema.TaggedError<MissingHotlineEventError>()("MissingHotlineEventError", {
    eventSubjects: Schema.Array(Schema.String),
    date: Schema.Date
}) {}

export class DetermineHotlineUserError extends Schema.TaggedError<DetermineHotlineUserError>()("DetermineHotlineUserError", {
    userNames: Schema.Array(Schema.String),
    eventSubject: Schema.String,
    regex: Schema.String
})  {}
