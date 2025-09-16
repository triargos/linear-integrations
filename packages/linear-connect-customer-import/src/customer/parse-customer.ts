import { Data, Effect, Schema } from "effect";
import { CsvRowSchema } from "../csv/parse-csv.ts";

/**
 * Schema representing a parsed customer with validated domain information.
 */
export class CustomerSchema extends Schema.Class<CustomerSchema>("CustomerSchema")({
    /** Customer name from the CSV */
    name: Schema.String,
    /** Array of validated domain names extracted from website field */
    domains: Schema.Array(Schema.String),
    /** Optional number of children associated with the customer */
    childCount: Schema.optional(Schema.Number)
}) {}

/**
 * Error thrown when a domain cannot be extracted or validated from the website field.
 * Contains detailed information about the failure for debugging purposes.
 */
export class InvalidDomainError extends Data.TaggedError("InvalidDomainError")<{
    /** The invalid domain string that caused the error */
    domain: string;
    /** The original CSV row that contained the invalid domain */
    row: CsvRowSchema;
    /** The customer name for context in error reporting */
    customerName: string;
}> {}

/**
 * Regular expression pattern for validating domain names.
 * Ensures domains follow RFC standards with proper character restrictions.
 */
const DomainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;


/**
 * Parses a CSV row into a Customer object with validated domain extraction.
 * 
 * The function extracts and cleans the website field by:
 * - Removing protocol (http/https)
 * - Removing www prefix
 * - Removing leading/trailing slashes
 * - Converting to lowercase
 * - Validating domain format and ensuring it contains at least one dot
 * 
 * @param row - The CSV row data containing customer information
 * @returns Effect that resolves to a CustomerSchema or fails with InvalidDomainError
 */
export const parseCsvRowToCustomer = Effect.fn("parseCsvRowToCustomer")(function* ({ row }: { row: CsvRowSchema }) {
    const domains: string[] = [];
    
    // Extract and clean the domain from the website field
    const cleanDomain = yield* Effect.sync(() => row.Website.replace(/^https?:\/\//, '')).pipe(
        Effect.flatMap(withoutProtocol => Effect.sync(() => withoutProtocol.replace(/^www\./, ''))),
        Effect.flatMap(withoutSubdomain => Effect.sync(() => withoutSubdomain.replace(/^\/+|\/+$/g, ''))),
        Effect.flatMap(withoutSlashes => Effect.sync(() => withoutSlashes.toLowerCase()))
    );
    
    // Validate that the domain contains at least one dot and matches the pattern
    if (cleanDomain && cleanDomain.includes('.') && DomainPattern.test(cleanDomain)) {
        domains.push(cleanDomain);
    } else {
        return yield* new InvalidDomainError({
            domain: cleanDomain,
            row,
            customerName: row.B_Zuordnung
        });
    }

    return new CustomerSchema({
        name: row.B_Zuordnung,
        domains,
        childCount: row.Kinderzahl
    });
});