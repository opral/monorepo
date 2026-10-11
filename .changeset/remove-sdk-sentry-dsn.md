---
"@inlang/sdk": patch
---

Remove the unused `PUBLIC_INLANG_SDK_SENTRY_DSN` entry from the SDK's build-time env variables. Nothing read it since Sentry was removed from the SDK.
