import { Schema } from "effect";

/**
 * Schema defining the available actions for triage responsibility.
 * Supports two modes:
 * - "notify": Send notifications to specified users about new issues
 * - "assign": Automatically assign new issues to specified users
 */
const TriageResponsibilityActionSchema = Schema.Literal("notify", "assign");

/**
 * Schema for an optional array of user IDs.
 * Used to specify which users should be notified or assigned during triage.
 * The array is mutable and contains string user IDs.
 */
const OptionalUsersArraySchema = Schema.optional(
  Schema.mutable(Schema.Array(Schema.String)),
);
/**
 * Schema for creating triage responsibility configurations.
 * Defines the structure for setting up automated triage actions in Linear.
 */
export const CreateTriageResponsibilitySchema = Schema.Struct({
  /** The action to take when triaging issues - either notify users or assign to them */
  action: TriageResponsibilityActionSchema,
  /** The Linear team ID where this triage responsibility applies */
  teamId: Schema.String,
  /** Optional array of user IDs to notify or assign issues to */
  users: OptionalUsersArraySchema,
});

/**
 * Type representing the options for creating a new triage responsibility.
 * Derived from the CreateTriageResponsibilitySchema structure.
 */
export type CreateTriageResponsibilityOptions = Schema.Schema.Type<
  typeof CreateTriageResponsibilitySchema
>;

/**
 * Schema for updating existing triage responsibility configurations.
 * Only requires the ID, with all other fields optional for partial updates.
 */
export const UpdateTriageResponsibilitySchema = Schema.Struct({
  /** The unique ID of the triage responsibility to update */
  id: Schema.String,
  /** Optional action to update - either notify users or assign to them */
  action: Schema.optional(TriageResponsibilityActionSchema),
  /** Optional array of user IDs to notify or assign issues to */
  users: OptionalUsersArraySchema,
});

/**
 * Type representing the options for updating a triage responsibility.
 * Requires ID and allows partial updates to other fields.
 */
export type UpdateTriageResponsibilityOptions = Schema.Schema.Type<
  typeof UpdateTriageResponsibilitySchema
>;

/**
 * Schema for identifying a specific triage responsibility by its unique ID.
 * Used for operations that require referencing an existing triage responsibility.
 */
export const TriageResponsibilityIdSchema = Schema.Struct({
  /** The unique identifier of the triage responsibility */
  id: Schema.String,
});

/**
 * Type representing options that contain only a triage responsibility ID.
 * Used for delete operations or when only identification is needed.
 */
export type TriageResponsibilityIdOptions = Schema.Schema.Type<
  typeof TriageResponsibilityIdSchema
>;
