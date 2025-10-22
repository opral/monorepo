---
"@inlang/cli": minor
---

Require the `INLANG_GOOGLE_TRANSLATE_API_KEY` environment variable for machine translations.

We previously subsidized machine translation costs. As projects become larger, our bill is no longer sustainable.

To ensure that machine translations remain available, we are switching to a Bring Your Own Key (BYOK) model.

**Before**

```sh
npx @inlang/cli machine translate --project ./project.inlang
```

**After**

```sh
export INLANG_GOOGLE_TRANSLATE_API_KEY="your-google-api-key"
npx @inlang/cli machine translate --project ./project.inlang
```
