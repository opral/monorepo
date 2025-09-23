---
"@inlang/paraglide-js": patch
---

fix: fix eslint incorrectly linting generated files

closes https://github.com/opral/inlang-paraglide-js/issues/558

eslint ignores single-line 'eslint-disable' comments at the start of a file.
Using a block comment without a closing one instead will prompt eslint to ignore it.

```diff
-	output[filename] = `// eslint-disable\n${content}`;
+	output[filename] = `/* eslint-disable */\n${content}`;
```
