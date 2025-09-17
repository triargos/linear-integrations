import {Data} from "effect";
import {LinearError} from "../../internal/error.ts";
import {CustomerDataSchema} from "./customer-schemas.ts";

/**
 * Error thrown when listing customers fails.
 * Caused by Linear API errors during retrieval of customer list.
 */
export class ListCustomersError extends Data.TaggedError("ListCustomersError")<{
    error: LinearError
}> {}

/**
 * Error thrown when finding a specific customer fails.
 * Caused by Linear API errors or when the customer is not found.
 */
export class FindCustomerError extends Data.TaggedError("FindCustomerError")<{
    error: LinearError
    id: string
}> {}

/**
 * Error thrown when a customer operation returns an invalid or missing customer ID.
 * This should rarely occur and indicates an issue with the Linear API response.
 */
export class InvalidCustomerIdError extends Data.TaggedError("InvalidCustomerIdError")<{
    action: "create" | "update"
    input: CustomerDataSchema
}> {}

/**
 * Error thrown when creating a customer fails.
 * Caused by Linear API errors during customer creation.
 */
export class CreateCustomerError extends Data.TaggedError("CreateCustomerError")<{
    error: LinearError
    input: CustomerDataSchema
}> {}

/**
 * Error thrown when updating a customer fails.
 * Caused by Linear API errors during customer update.
 */
export class UpdateCustomerError extends Data.TaggedError("UpdateCustomerError")<{
    error: LinearError
    id: string
    input: CustomerDataSchema
}> {}