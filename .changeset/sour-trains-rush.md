---
"@inlang/paraglide-next": minor
---

A major overhaul to the way routing is done. This update introduces the concept of a `RoutingStrategy`, which allows you to implement any arbitrary routing strategy ontop of `paraglide-next`'s primitives.

Alongside this we add the `Navigation` and `Middleware` APIs, which take advantage of the new RoutingStrategy interface.

While this is a major change to how the library is used, the old `createI18n` API is still available & works the same. Thus this is not marked as a major change.

The legacy `createI18n` API will be removed in the next major release.