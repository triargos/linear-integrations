import { Data, Effect, Schema } from "effect";
import { CsvRowSchema } from "../csv/parse-csv";

/**
 * Schema representing a parsed customer with validated domain information.
 */
export class CustomerSchema extends Schema.Class<CustomerSchema>("CustomerSchema")({
    id: Schema.String,
    /** Customer name from the CSV */
    name: Schema.String,
    /** Array of validated domain names extracted from website field */
    domains: Schema.mutable(Schema.Array(Schema.String)),
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
 * The function extracts domains from both email and website fields:
 * - Primary domain from email address (after @ symbol)
 * - Secondary domain from website field (cleaned and validated)
 * - Removes duplicates and validates format
 * 
 * @param row - The CSV row data containing customer information
 * @returns Effect that resolves to a CustomerSchema or fails with InvalidDomainError
 */

const DOMAINS_TO_EXCLUDE = [
    "t-online.de"
]


export const parseCsvRowToCustomer = Effect.fn("parseCsvRowToCustomer")(function* ({ row }: { row: CsvRowSchema }) {
    const domains: string[] = [];
    
    // Extract domain from email address
    const [_, emailDomain] = row.E_Mail.split("@")
    // Validate email domain
    if (emailDomain && emailDomain.includes(".") && DomainPattern.test(emailDomain)) {
        domains.push(emailDomain);
    }
    // Ensure we have at least one valid domain
    if (domains.length === 0 || domains.some(domain => DOMAINS_TO_EXCLUDE.includes(domain))) {
        return yield* new InvalidDomainError({
            domain: emailDomain,
            row,
            customerName: row.B_Zuordnung
        });
    }

    return new CustomerSchema({
        id: row.Debitornummer.toString(),
        name: row.B_Zuordnung,
        domains,
        childCount: row.Kinderzahl
    });
});