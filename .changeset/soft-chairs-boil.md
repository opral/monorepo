---
"@inlang/paraglide-js": minor
---

feat: expose compiler as library 

closes https://github.com/opral/inlang-paraglide-js/issues/206

The Paraglide compiler is now exposed as a library. This allows you to use and extend the compiler however you need. 

```ts
import { compile } from '@inlang/paraglide-js/compiler';

await compile({
  path: "/path/to/project.inlang",
  outdir: "/path/to/output",
});
```