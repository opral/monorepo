---
"@inlang/paraglide-js": patch
---

Add Vary: Accept-Language header when preferredLanguage strategy is used

Paraglide middleware now automatically sets the `Vary: Accept-Language` header when performing redirects based on the `preferredLanguage` strategy. This indicates to clients (CDN cache, crawlers, etc.) that the response will be different depending on the `Accept-Language` header, ensuring proper caching behavior and SEO compliance.

Closes https://github.com/opral/inlang-paraglide-js/issues/522
