import {Effect, Ref} from "effect"
import {ClientCredentialRequest, ConfidentialClientApplication} from "@azure/msal-node"
import {AuthenticationProvider, Client} from "@microsoft/microsoft-graph-client"
import {ConfigurationService, ConfigurationServiceLive, loadConfig} from "../config/config"
import {
    GraphAuthInitializationError,
    GraphClientInitializationError,
    GraphTokenAcquisitionError,
    GraphTokenRefreshError
} from "./graph-auth-errors"

export interface IGraphAuthService {
    readonly getAccessToken: Effect.Effect<string, GraphTokenAcquisitionError | GraphTokenRefreshError>
    readonly getGraphClient: Effect.Effect<Client, GraphClientInitializationError | GraphTokenAcquisitionError>
    readonly refreshToken: Effect.Effect<string, GraphTokenRefreshError | GraphTokenAcquisitionError>
    readonly validateToken: Effect.Effect<boolean, GraphTokenAcquisitionError>
}


const makeGraphAuthService = Effect.gen(function* () {
    const cfg = yield* loadConfig
    const outlookConfig = cfg.outlook

    const msalApp = yield* Effect.try({
        try: () => new ConfidentialClientApplication({
            auth: {
                clientId: outlookConfig.auth.clientId,
                clientSecret: outlookConfig.auth.clientSecret,
                authority: `https://login.microsoftonline.com/${outlookConfig.auth.tenantId}`
            }
        }),
        catch: (error) => new GraphAuthInitializationError({
            message: `Failed to initialize MSAL application: ${error}`,
            tenantId: outlookConfig.auth.tenantId,
            clientId: outlookConfig.auth.clientId,
            configurationIssue: "MSAL initialization failed"
        })
    })

    const tokenRef = yield* Ref.make<string | null>(null)
    const expiryRef = yield* Ref.make<Date | null>(null)

    const acquireTokenFromMsal = Effect.gen(function* () {
        const scopes = ["https://graph.microsoft.com/.default"]
        const clientCredentialRequest: ClientCredentialRequest = {
            scopes: scopes,
        }
        yield* Effect.logDebug("Aquiring token from MSAL")
        const response = yield* Effect.tryPromise({
            try: () => msalApp.acquireTokenByClientCredential(clientCredentialRequest),
            catch: (error: any) => new GraphTokenAcquisitionError({
                message: `Failed to acquire access token: ${error?.errorMessage || error?.message || 'Unknown error'}`,
                tenantId: outlookConfig.auth.tenantId,
                clientId: outlookConfig.auth.clientId,
                scopes: scopes,
                errorCode: error?.errorCode,
                errorDescription: error?.errorDescription,
                correlationId: error?.correlationId,
                originalError: error
            })
        })

        if (!response?.accessToken) {
            return yield* Effect.fail(new GraphTokenAcquisitionError({
                message: "No access token received from MSAL",
                tenantId: outlookConfig.auth.tenantId,
                clientId: outlookConfig.auth.clientId,
                scopes: scopes
            }))
        }

        return response.accessToken
    })

    const getAccessToken = Effect.gen(function* () {
        const token = yield* Ref.get(tokenRef)
        const expiry = yield* Ref.get(expiryRef)

        if (token && expiry && expiry > new Date(Date.now() + 60000)) {
            yield* Effect.logDebug("Using cached access token...")
            return token
        }

        const newToken = yield* acquireTokenFromMsal
        const newExpiry = new Date(Date.now() + 50 * 60 * 1000) // 50 minutes

        yield* Ref.set(tokenRef, newToken)
        yield* Ref.set(expiryRef, newExpiry)

        return newToken
    })

    const refreshToken = Effect.gen(function* () {
        yield* Ref.set(tokenRef, null)
        yield* Ref.set(expiryRef, null)
        return yield* getAccessToken
    })

    const getGraphClient = Effect.gen(function* () {
        const accessToken = yield* getAccessToken
        return yield* Effect.try({
            try: () => {
                const authProvider = {
                    getAccessToken: async () => accessToken
                } satisfies AuthenticationProvider

                return Client.initWithMiddleware({
                    authProvider,
                    baseUrl: "https://graph.microsoft.com"
                })
            },
            catch: (error) => new GraphClientInitializationError({
                message: `Failed to initialize Graph client: ${error}`,
                endpoint: "https://graph.microsoft.com",
                reason: "Client initialization failed",
                originalError: error
            })
        })
    })

    const validateToken = Effect.gen(function* () {
        const token = yield* Ref.get(tokenRef)
        const expiry = yield* Ref.get(expiryRef)
        return token !== null && expiry !== null && expiry > new Date(Date.now() + 60000)
    })

    return {
        getAccessToken,
        getGraphClient,
        refreshToken,
        validateToken
    }
})

export class GraphAuthService extends Effect.Service<GraphAuthService>()("GraphAuthService", {
    effect: makeGraphAuthService,
    dependencies: [ConfigurationServiceLive]
}) {
}

export const GraphAuthServiceLive = GraphAuthService.Default
