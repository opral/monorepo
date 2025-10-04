---
"@inlang/sdk": major
"@inlang/paraglide-js": minor
"@inlang/cli": minor
---

Upgraded the [inlang SDK](https://github.com/opral/inlang-sdk) to [Lix](https://lix.dev/) v0.5 🎉 

## Highlights

### Writing directly to Lix state

State is now written straight into Lix instead of the SDK’s private in-memory SQLite snapshot. Every bundle, message, and variant change becomes a first-class Lix commit, unlocking:

- history and branching,
- writer-key aware workflows,
- change proposals and subscriptions, and
- a single source of truth for downstream tools.

### Per-file filesystem sync

Any inlang-based tooling that opens a project from disk (IDE extensions, CLIs, custom apps) used to patch the entire locale tree whenever a single message changed. That behaviour is at the heart of [opral/inlang-sherlock#173](https://github.com/opral/inlang-sherlock/issues/173) where editing one key in `en.json` would re-export every other locale file, destroying manual formatting or reintroducing stale content.

Thanks to Lix v0.5’s observable state and writer-key APIs we can now react to per-commit metadata and suppress our own writes. When `happy_elephant` in `en.json` is updated, the SDK marks only `en.json` as dirty, leaving `de.json` and friends untouched. Drift is still possible if another tool rewrites `en.json`, yet the blast radius falls from “the whole project just changed” to “only the file you touched,” making reviews and merges manageable across all inlang integrations.


