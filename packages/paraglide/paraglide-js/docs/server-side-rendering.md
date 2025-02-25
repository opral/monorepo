---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-video.js
---

# Server Side Rendering

Paraglide JS provides first-class support for server-side rendering (SSR) through its `serverMiddleware()` and async context management.

## Using `serverMiddleware()`

The `serverMiddleware()` handles request-scoped locale management automatically:

```ts
import { serverMiddleware } from './paraglide/runtime.js';

// In your request handler:
const response = await serverMiddleware(request, async ({ request, locale }) => {
  // Your request handling logic here
  return new Response(`Current locale: ${locale}`);
});
```

Key features:

- Automatically manages async local storage context
- Handles URL localization/delocalization
- Ensures locale state isolation between requests

### Automatic re-directs

The `serverMiddleware()` automatically re-directs requests to the appropriate localized URL.

For example, assume that the cookie strategy preceeds the url strategy. If a request from a client is made where the client's locale cookie is set to `de`, the `serverMiddleware()` will re-direct the request from `https://example.com/page` to `https://example.com/de/seite`. 

```diff
await compile({
  project: "./project.inlang",
  outdir: "./src/paraglide",
+  strategy: ['cookie', 'url'],
})
```

If the automatic redirects are not desired, you can increase the precedence of the `url` strategy: 

```diff
await compile({
  project: "./project.inlang",
  outdir: "./src/paraglide",
-  strategy: ['cookie', 'url'],
+  strategy: ['url', 'cookie'],
})
```

<doc-video src="https://youtu.be/RO_pMjSHgpI"></doc-video>


### Disabling Async Local Storage

You can use `disableAsyncLocalStorage: true` to disable the use of Node.js' AsyncLocalStorage. Paraglide JS uses Node.js' AsyncLocalStorage to maintain request context isolation. This is crucial for:

- Preventing locale information from leaking between concurrent requests
- Ensuring consistent URL origin resolution
- Maintaining a clean separation of request-specific state

<doc-callout type="warning">
Disabling AsyncLocalStorage is **only safe** in these environments:

- Cloudflare Workers  
- Vercel Edge Functions
- AWS Lambda (single-request mode)
- Other isolated runtime contexts
</doc-callout>

```ts
// Only disable in serverless environments
serverMiddleware(request, handler, { 
  disableAsyncLocalStorage: true // ⚠️ Use with caution
})
```

#### Best Practices

1. **Always enable AsyncLocalStorage** for:
   - Traditional Node.js servers
   - Docker containers handling multiple requests
   - Any environment with request pooling

2. **Test isolation** by making parallel requests:
```ts
// Test that locale doesn't leak between requests
await Promise.all([
  fetch('/fr/about'),
  fetch('/de/contact')
])
```

3. Monitor for these warning signs:
   - Random locale switches during load testing
   - Incorrect URL origins in logs
   - Session data appearing in wrong requests

## Manual Middleware Setup 

For frameworks without middleware support, use AsyncLocalStorage directly:

```ts
import { AsyncLocalStorage } from 'async_hooks';
import { 
  overwriteGetLocale,
  overwriteGetUrlOrigin
} from './paraglide/runtime.js';

const asyncStorage = new AsyncLocalStorage<{
  locale: string;
  origin: string;
}>();

// Set up once:
overwriteGetLocale(() => {
  return asyncStorage.getStore()?.locale ?? 'en';
});

overwriteGetUrlOrigin(() => {
  return asyncStorage.getStore()?.origin ?? 'https://default.com';
});

// Pseudo middleware example:
app.use((req, res, next) => {
  const locale = extractLocaleFromRequest(req);
  const origin = req.headers.host || 'https://default.com';
  
  asyncStorage.run({ locale, origin }, () => {
    next();
  });
});
```

## Serverless Environments

For edge functions and serverless platforms, you can use per-request overrides because each request is isolated:

```ts
// Cloudflare Worker example
export default {
  async fetch(request: Request) {
    // Determine locale from request
    const locale = getLocaleFromURL(request.url);
    
    // Override per-request
    overwriteGetLocale(() => locale);
    overwriteGetUrlOrigin(() => new URL(request.url).origin);

    return handleRequest(request);
  }
};

// Next.js Edge Middleware
import { NextResponse } from 'next/server';

export function middleware(request) {
  const locale = getLocaleFromCookie(request);
  
  overwriteGetLocale(() => locale);
  overwriteGetUrlOrigin(() => request.nextUrl.origin);

  return NextResponse.next();
}
```

Key advantages:

- No async storage needed (requests are isolated)
- Minimal overhead per request
- Works with cold-start environments

## Best Practices

- Use `serverMiddleware` for full-stack frameworks with SSR support
- Manual overrides work best for API routes/edge functions
- Combine with [Routing Strategies](/docs/strategy) for complete i18n solution
- Always test locale propagation in production-like environments