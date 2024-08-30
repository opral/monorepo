---
"@inlang/paraglide-next": minor
---

[Typed routes](https://nextjs.org/docs/app/api-reference/next-config-js/typedRoutes) are now supported. This adds typesafety to functions that expect an internal link.

- `<Link>`s now have typesafe `href` attributes
- `useRouter` now has has typesafe path arguments

```ts
import { paraglide } from "@inlang/paraglide-next/plugin"

export default paraglide({
	experimental: {
		typedRoutes: true, // enable this
	},
    paraglide: { ... },
})
```