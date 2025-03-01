## paraglideMiddleware()

> **paraglideMiddleware**\<`T`\>(`request`, `resolve`, `options`?): `Promise`\<`Response`\>

Defined in: [server/middleware.js:69](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/server/middleware.js)

Server middleware that handles locale-based routing and request processing.

This middleware performs several key functions:

1. Determines the locale for the incoming request using configured strategies
2. Handles URL localization and redirects
3. Maintains locale state using AsyncLocalStorage to prevent request interference

When URL strategy is used:

- If URL doesn't match the determined locale, redirects to localized URL
- De-localizes URLs before passing to server (e.g., `/fr/about` → `/about`)

### Type Parameters

• **T**

The return type of the resolve function

### Parameters

#### request

`Request`

The incoming request object

#### resolve

(`args`) => `T` \| `Promise`\<`T`\>

Function to handle the request

#### options?

Optional configuration for the middleware

##### disableAsyncLocalStorage?

`boolean`

If true, disables AsyncLocalStorage usage.
                                                          ⚠️ WARNING: This should ONLY be used in serverless environments
                                                          like Cloudflare Workers. Disabling AsyncLocalStorage in traditional
                                                          server environments risks cross-request pollution where state from
                                                          one request could leak into another concurrent request.

### Returns

`Promise`\<`Response`\>

### Examples

```typescript
// Basic usage in metaframeworks like NextJS, SvelteKit, Astro, Nuxt, etc.
export const handle = async ({ event, resolve }) => {
  return serverMiddleware(event.request, ({ request, locale }) => {
    // let the framework further resolve the request
    return resolve(request);
  });
};
```

```typescript
// Usage in a framework like Express JS or Hono
app.use(async (req, res, next) => {
  const result = await serverMiddleware(req, ({ request, locale }) => {
    // If a redirect happens this won't be called
    return next(request);
  });
});
```

```typescript
// Usage in serverless environments like Cloudflare Workers
// ⚠️ WARNING: This should ONLY be used in serverless environments like Cloudflare Workers.
// Disabling AsyncLocalStorage in traditional server environments risks cross-request pollution where state from
// one request could leak into another concurrent request.
export default {
  fetch: async (request) => {
    return serverMiddleware(
      request,
      ({ request, locale }) => handleRequest(request, locale),
      { disableAsyncLocalStorage: true }
    );
  }
};
```
