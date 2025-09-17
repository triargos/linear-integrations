import {Effect} from "effect";
import {LinearClientWrapper} from "../../internal/client-wrapper.ts";
import {
    CreateCustomerError,
    FindCustomerError,
    InvalidCustomerIdError,
    ListCustomersError,
    UpdateCustomerError
} from "./customer-errors.ts";
import {CustomerDataSchema} from "./customer-schemas.ts";

/**
 * Service for managing Linear customers.
 * Provides operations for creating, reading, updating customer records in Linear.
 */
export class LinearCustomers extends Effect.Service<LinearCustomers>()("LinearCustomers", {
    effect: Effect.gen(function* () {
        const client = yield* LinearClientWrapper;

        /**
         * Retrieves all customers from Linear.
         */
        const list = Effect.fn("customers.list")(function* () {
            const customers = yield* client.use(linearClient => linearClient.customers()).pipe(
                Effect.map(connection => connection.nodes),
                Effect.mapError(error => new ListCustomersError({error}))
            )
            yield* Effect.annotateCurrentSpan({customerSize: customers.length})
            return customers
        })


        /**
         * Finds a specific customer by its unique ID.
         */
        const findById = Effect.fn("customers.find")(function* (id: string) {
            yield* Effect.annotateCurrentSpan({id})
            return yield* client.use(linearClient => linearClient.customer(id)).pipe(
                Effect.mapError(error => new FindCustomerError({id, error}))
            )
        })

        /**
         * Creates a new customer with the provided data.
         */
        const create = Effect.fn("customers.create")(function* (options: CustomerDataSchema) {
            const customerId = yield* client.use(linearClient => linearClient.createCustomer(options)).pipe(
                Effect.map(created => created.customerId),
                Effect.mapError(error => new CreateCustomerError({input: options, error}))
            )
            if (!customerId) {
                return yield* new InvalidCustomerIdError({action: "create", input: options})
            }
            yield* Effect.annotateCurrentSpan({createdCustomerId: customerId})
            return yield* findById(customerId)
        })

        /**
         * Updates an existing customer with new data.
         */
        const update = Effect.fn("customers.update")(function* (id: string, options: CustomerDataSchema) {
            yield* Effect.annotateCurrentSpan({id})
            const customerId = yield* client.use(linearClient => linearClient.updateCustomer(id, options)).pipe(
                Effect.map(customer => customer.customerId),
                Effect.mapError(error => new UpdateCustomerError({id, error, input: options}))
            )
            if (!customerId) {
                return yield* new InvalidCustomerIdError({action: "update", input: options})
            }
            return yield* findById(customerId)
        })

        return {
            list,
            findById,
            create,
            update
        } as const
    })
}) {
}