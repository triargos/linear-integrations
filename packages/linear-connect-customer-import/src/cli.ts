#!/usr/bin/env node

import {Command, Options} from "@effect/cli"
import {NodeContext, NodeRuntime} from "@effect/platform-node"
import {Console, Effect, Layer, Redacted} from "effect"
import {Terminal} from "@effect/platform"
import {CsvParser} from "./csv/parse-csv";
import {UpsertCustomerService} from "./customer/upsert-customer";
import {parseCsvRowToCustomer} from "./customer/parse-customer";
import {LinearClient} from "@triargos/effect-linear";

const keyOption = Options.text("key").pipe(
    Options.withDescription("API key for authentication"),
    Options.withAlias("k")
)

const fileOption = Options.text("file").pipe(
    Options.withDescription("Path to CSV file to import"),
    Options.withAlias("f")
)

const importCommand = Command.make("import", {
        key: keyOption,
        file: fileOption
    }, ({key, file}) =>
        Effect.gen(function* () {
            const csvParser = yield* CsvParser
            const upsertService = yield* UpsertCustomerService

            if (!key || key.trim().length === 0) {
                return yield* Effect.fail("API key is required and cannot be empty")
            }

            if (!file || file.trim().length === 0) {
                return yield* Effect.fail("File path is required and cannot be empty")
            }

            yield* Effect.logInfo(`Importing customers from: ${file}`)
            yield* Effect.logInfo(`Using API key: ${key.slice(0, 8)}...`)

            const csvRows = yield* csvParser.readCustomersFile({customFilePath: file})
            yield* Effect.logInfo(`Found ${csvRows.length} rows in CSV file`)
            const {failedRows, customers} = yield* csvParser.parseCsvRows({rows: csvRows})
            yield* Effect.logInfo(`Parsing ${customers.length} customer domains...`)
            const [failedCustomers, parsedCustomers] = yield* Effect.partition(customers, (customer) => parseCsvRowToCustomer({row: customer}), {concurrency: "unbounded"})
            if (failedRows.length > 0) {
                yield* Effect.logWarning(`Failed to parse ${failedCustomers.length} customers. Please check the error file afterwards`)
            }
            const {failed} = yield* upsertService.upsertCustomers({customers: parsedCustomers})
            if (failed.length > 0) {
                yield* Effect.logWarning(`Failed to upsert ${failed.length} customers.`)
            }
            yield* Effect.logInfo(`Processed ${parsedCustomers.length - failed.length} customers successfully`)
        }).pipe(
            Effect.catchAll((error) =>
                Effect.logError(`Import failed: ${error}`)
            ),
            Effect.provide(Layer.provideMerge(UpsertCustomerService.Default, LinearClient.layer({apiKey: Redacted.make(key)})))
        )
)

const cli = Command.run(importCommand, {
    name: "Linear Customer Import",
    version: "1.0.0"
})

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Exiting gracefully...')
    process.exit(0)
})

cli(process.argv).pipe(
    Effect.provide(CsvParser.Default),
    Effect.provide(NodeContext.layer),
    NodeRuntime.runMain
)