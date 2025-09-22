import {Schema} from 'effect';

export class CalendarOwner extends Schema.Class<CalendarOwner>("CalendarOwner")({
    name: Schema.optional(Schema.String),
    address: Schema.optional(Schema.String),
}) {}



export class Calendar extends Schema.Class<Calendar>("Calendar")({
    id: Schema.String,
    name: Schema.String,
    color: Schema.optional(Schema.String),
    owner: Schema.optional(CalendarOwner),
    canShare: Schema.optional(Schema.Boolean),
    canViewPrivateItems: Schema.optional(Schema.Boolean),
    canEdit: Schema.optional(Schema.Boolean),
    defaultOnlineMeetingProvider: Schema.optional(Schema.String),
    isTallyingResponses: Schema.optional(Schema.Boolean),
    isRemovable: Schema.optional(Schema.Boolean),
    isDefaultCalendar: Schema.optional(Schema.Boolean),
}) {}

export class CalendarListResponse extends Schema.Class<CalendarListResponse>("CalendarListResponse")({
    value: Schema.Array(Calendar),
    '@odata.context': Schema.optional(Schema.String),
    '@odata.nextLink': Schema.optional(Schema.String),
}) {}

export class EventDateTime extends Schema.Class<EventDateTime>("EventDateTime")({
    dateTime: Schema.String,
    timeZone: Schema.optional(Schema.String),
}) {}

export class Event extends Schema.Class<Event>("Event")({
    id: Schema.String,
    subject: Schema.optional(Schema.String),
    body: Schema.optional(
        Schema.Struct({
            contentType: Schema.String,
            content: Schema.String,
        })
    ),
    start: EventDateTime,
    end: EventDateTime,
}) {}

export class EventListResponse extends Schema.Class<EventListResponse>("EventListResponse")({
    value: Schema.Array(Event),
    '@odata.context': Schema.optional(Schema.String),
    '@odata.nextLink': Schema.optional(Schema.String),
}) {}

