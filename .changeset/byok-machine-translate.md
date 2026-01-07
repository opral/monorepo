---
"@inlang/cli": minor
---

Prefer the `INLANG_GOOGLE_TRANSLATE_API_KEY` environment variable for machine translations, with an RPC fallback.

We are moving toward a Bring Your Own Key (BYOK) model while keeping an RPC fallback for now.

**Before**

```sh
npx @inlang/cli machine translate --project ./project.inlang
```

**After**

```sh
export INLANG_GOOGLE_TRANSLATE_API_KEY="your-google-api-key"
npx @inlang/cli machine translate --project ./project.inlang
```

If the API key is not set, the CLI will warn and fall back to the inlang RPC translation service.
