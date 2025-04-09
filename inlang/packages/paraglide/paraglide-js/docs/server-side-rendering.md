---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-video.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Server Side Rendering (SSR) / Static Site Generation (SSG)

Paraglide JS provides first-class support for server-side rendering (SSR) and static site generation (SSG) through the `paraglideMiddleware()`.  

<doc-callout type="tip">
  If you just want to use Paraglide JS on the server, in CLI apps, etc, without SSR/SSG, refer to the vanilla JS/TS docs.
</doc-callout>

## Using `paraglideMiddleware()`

The `paraglideMiddleware()` handles request-scoped locale management automatically:

```ts
import { paraglideMiddleware } from './paraglide/server.js';

app.get("*", async (request) => {
  return paraglideMiddleware(request, async ({ request, locale }) => {
    // Your request handling logic here
    return Response(html(request));
  });
});
```

Key features:

- Automatically manages async local storage context
- Handles URL localization/delocalization
- Ensures locale state isolation between requests

### Automatic re-directs

The `paraglideMiddleware()` automatically re-directs requests to the appropriate localized URL.

For example, assume that the cookie strategy preceeds the url strategy. If a request from a client is made where the client's locale cookie is set to `de`, the `paraglideMiddleware()` will re-direct the request from `https://example.com/page` to `https://example.com/de/seite`. 

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

You can use `disableAsyncLocalStorage: true` to disable the use of Node.js' AsyncLocalStorage. **This is only safe** in environments that do not share request context between concurrent requests. 

**Examples of safe environments:**

- Cloudflare Workers  
- Vercel Edge Functions
- AWS Lambda (single-request mode)
- Other isolated runtime contexts

```ts
paraglideVitePlugin({
  // ...
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

### Serverless Environments

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

## Server Side Rendering (SSR)

Setting up the `paraglideMiddleware()` automatically enables server-side rendering (SSR) for your application.

## Static Site Generation (SSG)

Your framework of choice (e.g. Next.js, SvelteKit, etc.) needs to know the localized URLs of your pages to generate them during build time. 

```diff
https://example.com/about
+https://example.com/de/about
+https://example.com/fr/about
```

Several possibilities exist to communicate these URLs to your framework:

### Site crawling (invisible anchor tags)

Some static site generators crawl your site during build time by following anchor tags to discover all pages. You can leverage this behavior to ensure all localized URLs of your pages are generated:

1. Add invisible anchor tags in the root layout of your application for each locale
2. Ensure the `paraglideMiddleware()` is called

_You can adapt the example beneath to any other framework_

```tsx
import { locales, localizeHref } from "./paraglide/runtime.js";

// in the root layout
function Layout({ children }) {
  return (
    <div>{children}</div>
    // add invisible anchor tags for the currently visible page in each locale
    <div style="display: none">
      {locales.map((locale) => (
        <a href={localizeHref(`/about`, { locale })}></a>
      ))}
    </div>
  )
}
```

The rendered HTML of the page will include the invisible anchor tags, ensuring they are generated during build time. The framwork will crawl the HTML and follow the anchor tags to discover all pages.

```diff
<div>
  <p>My Cool Website
</div>
+<div style="display: none">
+  <a href="/de/about"></a>
+  <a href="/fr/about"></a>
+</div>
```

### Programmatic Discovery

If invisible anchor tags are not an option, some frameworks provide APIs to discover the localized URLs during build time. Figure out which API your framework provides and adapt the example above accordingly. 

- **Next.js** has [generateStaticParams()](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) API to discover all localized URLs.
- **Astro** has [getStaticPaths()](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths)

## Troubleshooting

### `getLocale()` returns a different locale than expected

This can happen if `getLocale()` is called outside of the scope of `paraglideMiddleware()`. 

The `paraglideMiddleware()` ensures that the locale is set correctly for each request. If you call `getLocale()` outside of the scope of `paraglideMiddleware()`, you will get the locale of the server which is not the expected locale.

```ts
app.get("*", async (request) => {
  // ❌ don't call `getLocale()` outside of `paraglideMiddleware`
  const locale = getLocale()
  
  return paraglideMiddleware(request, async ({ request, locale }) => {
    // ✅ call `getLocale()` inside of `paraglideMiddleware`
    const locale = getLocale()
    
    // Your request handling logic here
    return Response(html(request));
  });
});