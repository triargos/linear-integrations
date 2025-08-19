import { Schema } from 'effect';

export const CalendarOwner = Schema.Struct({
  name: Schema.optional(Schema.String),
  address: Schema.optional(Schema.String),
});

export const Calendar = Schema.Struct({
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
});

export const CalendarListResponse = Schema.Struct({
  value: Schema.Array(Calendar),
  '@odata.context': Schema.optional(Schema.String),
  '@odata.nextLink': Schema.optional(Schema.String),
});

export const EventDateTime = Schema.Struct({
  dateTime: Schema.String,
  timeZone: Schema.optional(Schema.String),
});

export const Event = Schema.Struct({
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
});

export const EventListResponse = Schema.Struct({
  value: Schema.Array(Event),
  '@odata.context': Schema.optional(Schema.String),
  '@odata.nextLink': Schema.optional(Schema.String),
});

export type Calendar = Schema.Schema.Type<typeof Calendar>;
export type CalendarOwner = Schema.Schema.Type<typeof CalendarOwner>;
export type CalendarListResponse = Schema.Schema.Type<
  typeof CalendarListResponse
>;
export type Event = Schema.Schema.Type<typeof Event>;
export type EventDateTime = Schema.Schema.Type<typeof EventDateTime>;
export type EventListResponse = Schema.Schema.Type<typeof EventListResponse>;
