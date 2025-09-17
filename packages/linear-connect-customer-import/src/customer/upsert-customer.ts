import {Effect, Option} from "effect";
import {type CustomerSchema} from "./parse-customer";
import {LinearClient} from "@triargos/effect-linear";

export interface LinearCustomer {
    id: string
    externalIds: string[]
    domains: string[]
    name: string
    size?: number
}

export class UpsertCustomerService extends Effect.Service<UpsertCustomerService>()("UpsertCustomerService", {
    effect: Effect.gen(function* () {
        const linear = yield* LinearClient

        const upsertCustomers = Effect.fn("UpsertCustomerService.upsertCustomers")(function* ({customers}: {
            customers: CustomerSchema[]
        }) {
            const linearCustomers = yield* linear.customers.list()
            yield* Effect.logDebug(`Found ${linearCustomers.length} existing linear customers`)
            const [failedUpserts, successfulUpserts] = yield* Effect.partition(customers, (customer) => upsertCustomer({
                customer,
                linearCustomers
            }), {concurrency: 10})
            yield* Effect.annotateCurrentSpan({
                customers: customers.length,
                linearCustomers: linearCustomers.length,
                failedUpserts: failedUpserts.length
            })
            yield* Effect.logDebug(`Processed ${customers.length} customers`, {
                errorCount: failedUpserts.length,
                successCount: successfulUpserts.length
            })
            return {failed: failedUpserts}
        })

        const findMatchingCustomer = Effect.fn("UpsertCustomerService.findMatchingCustomer")(function* ({
                                                                                                            customer,
                                                                                                            linearCustomers
                                                                                                        }: {
            customer: CustomerSchema,
            linearCustomers: LinearCustomer[]
        }) {
            const externalIdMatch = linearCustomers.find(linearCustomer => linearCustomer.externalIds.includes(customer.id))
            if (externalIdMatch) {
                yield* Effect.logInfo(`Found existing customer for ID (${customer.id}): ${externalIdMatch.name}`)
                return Option.some(externalIdMatch)
            }
            const domainMatch = linearCustomers.find(linearCustomer => linearCustomer.domains.some(domain => customer.domains.includes(domain)))
            if (domainMatch) {
                yield* Effect.logInfo(`Found existing customer (${domainMatch.id}): ${domainMatch.name} by domain`)
                return Option.some(domainMatch)
            }
            return Option.none()
        })


        const upsertCustomer = Effect.fn("UpsertCustomerService.upsertCustomer")(function* ({
                                                                                                customer,
                                                                                                linearCustomers
                                                                                            }: {
            customer: CustomerSchema,
            linearCustomers: LinearCustomer[]
        }) {
            //Try to find a matching customer by external ID
            const matchingCustomer = yield* findMatchingCustomer({customer, linearCustomers})
            return yield* Option.match(matchingCustomer, {
                onSome: (linearCustomer) => Effect.gen(function * () {
                    const needsUpdate = linearCustomer.size !== customer.childCount || linearCustomer.name !== customer.name
                    if (needsUpdate) {
                        yield* linear.customers.update(linearCustomer.id, {
                            ...linearCustomer,
                            name: customer.name,
                            size: customer.childCount
                        })
                    }
                }),
                onNone: () => Effect.gen(function * () {
                    yield* Effect.logInfo(`Creating new customer for ID ${customer.id}`, {
                        name: customer.name,
                        id: customer.id,
                        domains: customer.domains
                    })
                    yield* linear.customers.create({
                        name: customer.name,
                        externalIds: [customer.id],
                        size: customer.childCount,
                        domains: customer.domains
                    })
                })
            })
        })
        return {upsertCustomer, upsertCustomers} as const
    })
}) {
}