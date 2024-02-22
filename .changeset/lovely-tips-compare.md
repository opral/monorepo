---
"@inlang/paraglide-js-adapter-sveltekit": minor
---

feat: Automatically call `invalidate("paraglide:lang")` when the language changes. You can now call `depends("paraglide:lang")` in your server-load functions to have them re-run on language changes.
