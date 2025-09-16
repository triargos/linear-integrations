import { Data, Effect, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { ParseError } from "effect/ParseResult";
import { Readable } from "stream";
import csvParser from "csv-parser";

/**
 * Regular expression for validating email addresses.
 * Ensures the email format is valid and follows common email standards.
 */
const EmailRegex = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_'+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i;

/**
 * Schema for validating CSV data rows containing customer information.
 * Validates that customer names, websites, and emails don't contain newlines,
 * and that email addresses follow proper format.
 */

export class CsvRowSchema extends Schema.Class<CsvRowSchema>("CsvRowSchema")({
    B_Zuordnung: Schema.NonEmptyString.pipe(
        Schema.pattern(/^[^\r\n]*$/, { message: () => "Customer name must not contain newlines" }),
    ).annotations({ message: (parseIssue) => `Expected a customer name, received ${parseIssue.actual}` }),
    Website: Schema.String.pipe(
        Schema.pattern(/^[^\r\n]*$/, { message: () => "Website must not contain newlines" }),
    ),
    E_Mail: Schema.String.pipe(
        Schema.pattern(/^[^\r\n]*$/, { message: () => "Email must not contain newlines" }),
        Schema.pattern(EmailRegex, { message: (parseIssue) => `Expected a valid email address, received ${parseIssue.actual}` }),
    ),
    Kinderzahl: Schema.optional(Schema.Number),
}) {}

/**
 * Error thrown when a CSV row fails to parse according to the schema.
 * Contains information about which row failed and why.
 */
export class ParseCsvRowError extends Data.TaggedError("ParseCsvRowError")<{
    /** The index of the row that failed to parse (0-based) */
    rowIndex: number;
    /** The raw contents of the row that failed to parse */
    rowContents: unknown;
    /** The detailed parse error from the schema validation */
    parseError: ParseError;
}> {}

/**
 * Service for parsing CSV files containing customer data.
 * Provides methods to read CSV files and parse them according to the CsvDataSchema.
 */
export class CsvParser extends Effect.Service<CsvParser>()("CsvParser", {
    effect: Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        
        /**
         * Reads a CSV file from the specified path and returns the raw rows.
         * @param customFilePath - Absolute path to the CSV file to read
         * @returns Array of raw CSV row objects
         */
        const readCustomersFile = Effect.fn("CsvParser.readCustomersFile")(function* ({ customFilePath }: {
            customFilePath: string;
        }) {
            yield* Effect.logDebug(`Reading file at ${customFilePath}...`);
            const fileContents = yield* fs.readFileString(customFilePath).pipe(contents => Effect.try({
                try: () => Readable.from(contents),
                catch: (error) => new Error(`Failed to create readable from file contents: ${error}`)
            }));
            yield* Effect.logDebug(`Parsing file stream...`);
            const csvRows = yield* Effect.async<unknown[], Error>((resume) => {
                const results: unknown[] = [];
                fileContents
                    .pipe(csvParser())
                    .on('data', (data) => results.push(data))
                    .on('end', () => resume(Effect.succeed(results)))
                    .on('error', (err) => resume(Effect.fail(new Error(`CSV parsing failed: ${err.message}`))));
            });
            yield* Effect.logDebug(`Read ${csvRows.length} records from file`);
            return csvRows;
        });

        /**
         * Parses raw CSV rows according to the CsvDataSchema.
         * @param rows - Array of raw CSV row objects to parse
         * @returns Object containing successfully parsed customers and failed rows with errors
         */
        const parseCsvRows = Effect.fn("CsvParser.parseCsvRows")(function* ({ rows }: { rows: unknown[] }) {
            const [failedRows, customers] = yield* Effect.partition(rows, (row, index) => 
                Schema.decodeUnknown(CsvRowSchema)(row).pipe(
                    Effect.catchAll(parseError => new ParseCsvRowError({
                        parseError,
                        rowIndex: index,
                        rowContents: row
                    }))
                )
            );
            yield* Effect.logDebug(`Parsed ${customers.length} rows successfully, ${failedRows.length} with error`);
            return { failedRows, customers };
        });
        
        return { readCustomersFile, parseCsvRows } as const;
    })
}) {}