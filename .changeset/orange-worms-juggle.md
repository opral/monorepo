---
"@inlang/cli": major
---

Upgrade to the inlang SDK v2.

BREAKING:

- The `inlang lint` command has been removed. Please upvote https://github.com/opral/lix-sdk/issues/239 to re-introduce linting in a future release.

```diff
- inlang lint
```

- Machine translate now takes `locales` instead of `languageTags` as argument

```diff
- inlang machine-translate --languageTags en,de
+ inlang machine-translate --locales en,de
```