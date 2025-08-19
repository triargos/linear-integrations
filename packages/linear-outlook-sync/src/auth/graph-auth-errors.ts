import { Data } from "effect"

export class GraphAuthInitializationError extends Data.TaggedError("GraphAuthInitializationError")<{
  readonly message: string
  readonly tenantId?: string
  readonly clientId?: string
  readonly configurationIssue?: string
}> {}

export class GraphTokenAcquisitionError extends Data.TaggedError("GraphTokenAcquisitionError")<{
  readonly message: string
  readonly tenantId: string
  readonly clientId: string
  readonly scopes: readonly string[]
  readonly errorCode?: string
  readonly errorDescription?: string
  readonly correlationId?: string
  readonly originalError?: unknown
}> {}

export class GraphTokenRefreshError extends Data.TaggedError("GraphTokenRefreshError")<{
  readonly message: string
  readonly tenantId: string
  readonly clientId: string
  readonly tokenExpiry?: Date
  readonly errorCode?: string
  readonly originalError?: unknown
}> {}

export class GraphClientInitializationError extends Data.TaggedError("GraphClientInitializationError")<{
  readonly message: string
  readonly endpoint: string
  readonly reason: string
  readonly originalError?: unknown
}> {}

export class GraphAuthConfigurationError extends Data.TaggedError("GraphAuthConfigurationError")<{
  readonly message: string
  readonly missingField?: string
  readonly invalidValue?: string
  readonly expectedFormat?: string
}> {}