#### If you find security issues with this approach, please write hello@inlang.com.

# Auth

Auth uses [(GitHub) OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps).

### Using OAuth has the following benefits:

- users already have GitHub accounts

- changes a user conducts are executed on behalf of the user ("samuelstroschein changed message X")

- no auth system needs to be implemented on inlang's side. GitHub auth and permissions can be used (little to no overhead when adopting inlang)

### Architecture

Client-side requests are tunneled through a server that adds authentification tokens based on a cookie session that contains an encrypted access token when making requests to git hosts like GitHub or GitLab.

The nature of executing external JavaScript on the client via the config entails the requirement to never store, not even in memory for 1s, an access token from a git host. The chosen encryption algorithm is symmetric to ease implementation and because the client is not supposed to encrypt or decrypt anything.

### Procedure

1. The user is prompted to log in and thereby forwarded to the git host via [LoginDialog](./components/LoginDialog.tsx).

2. SERVER-SIDE: The git host redirects back to a site of inlang with an interim code after a successful login [server.ts](./server.ts).

3. SERVER-SIDE: The interim code is exchanged for an encrypted JWT (JWE) that contains the access token [server.ts](./server.ts)

4. SERVER-SIDE: The server stores the encrypted access token in a cookie session [server.ts](./server.ts).

It is extremely important that step 3 never leaks the interim code client side and is, therefore, processed server-side. Otherwise, an attacker could intercept the interim code and exchange it for an access token.

# Sessions

The session logic is based on [supertokens](https://supertokens.com/docs/session/introduction) session recipe for the production environment and uses a simplified local solution for the development environment, so that you don't need to spin-up a supertokens instance if you don't need to work on the session logic itself.
Because we went this hybrid approach, not all of supertokens session capabilities can be used. If you find yourself needing an interface which is not yet implemented, DON'T directly use supertokens interfaces but extend the wrapper, so that the local supertokenless development keeps working.
**Never use supertokens interfaces directly** outside of the session wrapper logic. Always import session specific logic from the custom session implementation.

## Integration into the OAuth Flow

1.  Navigate to the editor
2.  Session frontend get's initalized
3.  Frontend calls /services/auth/create-session route
4.  User clicks on Sign-In
5.  User gets redirected to OAuth provider
6.  OAuth Provider redirects back to the inlang frontend
7.  On the request the backend exchanges the interim token for the accessToken, encrypts it and saves it into the sessionData object, of the already created session, which is only available to the backend. Never comes into contact with the frontend and is not stored in the accessToken (not to be confused with the accessToken payload).
8.  The frontend initializes the session logic and all upcoming api calls (including telefunc calls) can be linked with the sessionData and the encrypted auth provider accessToken.

## Production

Set the following environment variables:

- `SUPERTOKENS_CONNECTION_URI`: e.g. `https://xxxxxxxxxx-eu-west-1.aws.supertokens.io:3569`
- `SUPERTOKENS_API_KEY`: e.g. `XXXXXXDqR4ZR0EnQmOonT-FVoDvD7V`

[Learn more about the initialization parameters for supertokens](https://supertokens.com/docs/session/quick-setup/backend)

## Development

In development a really simple cache based approach is used:

- 2 cookies are used to reproduce the capabilities of a supertokens session while not caring about security risks like CSRF
  - `inlang-dev-session-id` which contains the handle of the session
  - `inlang-dev-session-access-token-payload` which contains the serialized accessToken payload

### Working on the session logic

Set the environment variables required for production +

- `VITE_SUPERTOKENS_IN_DEV` to `true`

This disables the custom implementation for the development environment and enables the production session logic based on supertokens.

## Splitting front end backend to different domains

To prevent CORS based error we shouldn't switch to different domains, but use subdomains like api.inlang.com / app.inlang.com / ... Otherwise the session logic will no longer work.
If we switch to a subdomain based setup and no longer have everything on one domain, we'll need to add superbases CORS logic as a middleware to express. This can be added to the custom session middleware.
