---
"@inlang/sdk": minor
---

REFACTOR: Removed PluginUsesReservedNamespaceError.

The feedback loop for causing the error was too long. Creating a new inlang plugin always required adding the plugin to the whitelist, which has been forgotting leading to crashes in production.
Furthermore, the sdk should not crash if plugins are valid. The marketplace is the appropriate place to validate namespaces.
