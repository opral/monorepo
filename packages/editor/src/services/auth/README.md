#### If you find security issues with this approach, please write hello@inlang.com.

# Auth

Auth uses [(GitHub) OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps).

### Using OAuth has the following benefits:

- users already have GitHub accounts
- changes a user conducts are executed on behalf of the user ("samuelstroschein changed message X")
- no auth system needs to be implemented on inlang's side. GitHub auth and permissions can be used (little to no overhead when adopting inlang)

### Architecture

Client-side requests are tunneled through a server that adds authentification tokens based on a cookie session that contains an encrypted access token when making requests to git hosts like GitHub or GitLab.

The nature of executing external JavaScript on the client via the config entails the requirement to never store, not even in memory for 1s, an access token from a git host. The chosen encryption algorithm is symmetric to ease implementation and because the client is not supposed to encrypt or decrypt anything.

### Procedure

1. The user is prompted to log in and thereby forwarded to the git host via [LoginDialog](./src/components/LoginDialog.tsx).
2. SERVER-SIDE: The git host redirects back to a site of inlang with an interim code after a successful login [router.ts](./src/router.ts).
3. SERVER-SIDE: The interim code is exchanged for an encrypted JWT (JWE) that contains the access token [router.ts](./src/router.ts)
4. SERVER-SIDE: The server stores the encrypted access token in a cookie session [router.ts](./src/router.ts).

It is extremely important that step 3 never leaks the interim code client side and is, therefore, processed server-side. Otherwise, an attacker could intercept the interim code and exchange it for an access token.
