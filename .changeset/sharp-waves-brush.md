---
"@inlang/paraglide-next": patch
---

Added a `generateAlternateLinks` API for easily adding `<link rel="alternate"` tags to your page `<head>`. This is _in addition_ to the `Link` HTTP-Headers that are already present. 

Use it like this in your `layout.tsx` file:

```tsx
// src/app/layout.tsx
import { generateAlternateLinks } from "@inlang/paraglide-next"
import { strategy } from "@/lib/i18n"
import type { Metadata, ResolvingMetadata } from "next"

export const generateMetadata = (params: any, parent: ResolvingMetadata): Metadata => {
	return {
		alternates: {
			languages: generateAlternateLinks({
				origin: "https://example.com", // the origin of your site
				strategy: strategy,
				resolvingMetadata: parent,
			}),
		},
	}
}
```

> You do not need to do this on every page, just the root layout