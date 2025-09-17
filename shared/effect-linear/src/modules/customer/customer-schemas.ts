import {Schema} from "effect";

/**
 * Schema defining the structure for customer data in Linear.
 * Contains all the essential information for managing customer records.
 */
export class CustomerDataSchema extends Schema.Class<CustomerDataSchema>("CustomerDataSchema")({
    /** Array of domain names associated with the customer */
    domains: Schema.mutable(Schema.Array(Schema.String)),
    /** Optional array of external system identifiers for this customer */
    externalIds: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
    /** Optional URL pointing to the customer's logo image */
    logoUrl: Schema.optional(Schema.String),
    /** The customer's display name */
    name: Schema.String,
    /** Optional annual revenue amount for the customer */
    revenue: Schema.optional(Schema.Number),
    /** Optional company size (typically number of employees) */
    size: Schema.optional(Schema.Number),
}) {}
