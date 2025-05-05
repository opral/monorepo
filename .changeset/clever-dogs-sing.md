---
"@inlang/sdk": patch
---

Fix error when running the machine translate using `pathPattern` as an array

---

When running command `{npx|pnpm} inlang machine translate ...` is throwing an error when the `pathPattern` value is Array like this:

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "baseLocale": "es",
  "locales": ["es", "en"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
  ],
  "plugin.inlang.messageFormat": {
    // In this example, "pathPattern" is array
    "pathPattern": [
      "./messages/{locale}/home.json",
      "./messages/{locale}/shopping-cart.json"
    ]
  }
}
```

### Error message

```bash
deriancordoba@DerianCordoba project % pnpm machine-translate

> project@0.0.1 machine-translate /Users/deriancordoba/Developer/project
> inlang machine translate --project project.inlang

✔ Machine translate complete.

 ERROR   pathPattern.replace is not a function

  at saveProjectToDirectory (node_modules/.pnpm/@inlang+cli@3.0.11/node_modules/@inlang/cli/dist/main.js:56516:81)
  at async _Command.<anonymous> (node_modules/.pnpm/@inlang+cli@3.0.11/node_modules/@inlang/cli/dist/main.js:56647:5)

 ELIFECYCLE  Command failed with exit code 1.
```
