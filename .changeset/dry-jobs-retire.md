---
"@inlang/paraglide-next": minor
---

[Typed routes](https://nextjs.org/docs/app/api-reference/next-config-js/typedRoutes) are now supported. You can make the `href` attributes on `<Link>`s typesafe by enabling `as` in `next.config.mjs`.

```ts
import { paraglide } from "@inlang/paraglide-next/plugin"

export default paraglide({
	experimental: {
		typedRoutes: true, // enable this
	},
    paraglide: { ... },
})
```