---
"@inlang/paraglide-js": patch
---

Add domain property to cookie options.

```diff
paraglideVitePlugin({
  project: './project.inlang',
  outdir: "./src/paraglide",
+ cookieDomain: 'example.com'
}),
```
