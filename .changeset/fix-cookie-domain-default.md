---
"@inlang/paraglide-js": patch
---

Fix cookieDomain default behavior for better server/client cookie compatibility.

When `cookieDomain` is undefined or empty, cookies are now set without a domain attribute, scoping them to the exact current domain only (no subdomains). This fixes compatibility issues with server-side cookies that don't include a domain attribute.

**Before**:

```js
// When cookieDomain was undefined, cookies were set as:
document.cookie =
  "PARAGLIDE_LOCALE=en; path=/; max-age=34560000; domain=example.com";
// This made cookies available to subdomains
```

**After**:

```js
// When cookieDomain is undefined, cookies are now set as:
document.cookie = "PARAGLIDE_LOCALE=en; path=/; max-age=34560000";
// This scopes cookies to the exact current domain only
```

**Migration**:

- If you want the previous behavior (subdomain sharing), explicitly set `cookieDomain` in your configuration:

```diff
paraglideWebpackPlugin({
  project: './project.inlang',
  outdir: "./src/paraglide",
+ cookieDomain: 'example.com'
})
```
