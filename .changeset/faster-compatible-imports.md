---
"@inlang/sdk": patch
"@inlang/plugin-i18next": patch
"@inlang/plugin-message-format": patch
---

Speed up imports without changing plugin identities or message behavior. The
i18next importer emits one message per bundle and locale, and both i18next and
message-format avoid unnecessary parsing work for plain text. The SDK batches
unambiguous fresh imports with plugin-provided IDs or duplicate ID-less messages,
preserves variant order across insert shapes, and caches property lookups during
sequential imports while retaining conflict handling and partial-import behavior.
