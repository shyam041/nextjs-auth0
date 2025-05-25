import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
    // Options are loaded from environment variables by default
    authorizationParameters: {
        scope: process.env.AUTH0_SCOPE,
        audience: process.env.AUTH0_AUDIENCE,
    }
});
