import {Cache, Duration, Effect} from "effect";
import {ConfigurationService} from "../config/config.ts";
import {ClientCredentialRequest, ConfidentialClientApplication} from "@azure/msal-node";
import {
    GraphAuthInitializationError,
    GraphClientInitializationError,
    GraphTokenAcquisitionError
} from "./graph-auth-errors.ts";
import {AuthenticationProvider, Client} from "@microsoft/microsoft-graph-client";


export class GraphClient extends Effect.Service<GraphClient>()("GraphClient", {
    dependencies: [ConfigurationService.Default],
    effect: Effect.gen(function* () {
        const configService = yield* ConfigurationService
        const outlookConfig = yield* configService.load.pipe(Effect.map(cfg => cfg.outlook))
        const msalApp = yield* Effect.try({
            try: () =>
                new ConfidentialClientApplication({
                    auth: {
                        clientId: outlookConfig.auth.clientId,
                        clientSecret: outlookConfig.auth.clientSecret,
                        authority: `https://login.microsoftonline.com/${outlookConfig.auth.tenantId}`,
                    },
                }),
            catch: error =>
                new GraphAuthInitializationError({
                    message: `Failed to initialize MSAL application: ${error}`,
                    cause: error
                }),
        });

        const getAccessToken = Effect.fn("GraphClient.getAccessToken")(function* () {
            const scopes = ['https://graph.microsoft.com/.default'];
            const clientCredentialRequest: ClientCredentialRequest = {
                scopes: scopes,
            };
            const response = yield* Effect.tryPromise({
                try: () =>
                    msalApp.acquireTokenByClientCredential(clientCredentialRequest),
                catch: (error) =>
                    new GraphTokenAcquisitionError({
                        message: `Failed to acquire access token`,
                        cause: error
                    }),
            });
            if (!response?.accessToken) {
                return yield* new GraphTokenAcquisitionError({
                    message: "Access token missing in response"
                })
            }
            return response.accessToken
        })
        const token = yield* getAccessToken()
        return yield* Effect.try({
            try: () => {
                const provider = {getAccessToken: async () => token} satisfies AuthenticationProvider
                return Client.initWithMiddleware({
                    authProvider: provider,
                    baseUrl: `https://graph.microsoft.com`
                })
            },
            catch: (cause) => new GraphClientInitializationError({cause, message: `Failed to create graph client`})
        })
    })
}) {
}