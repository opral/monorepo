# Other Strategies

Appart from the default [Prefix Routing Stragegy](prefix-strategy) there are a few others available:

### Domain Strategy

This Strategy uses the domain of a request to determine the language.

```ts
import { DomainStrategy } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"

const strategy = DomainStrategy<AvailableLanguageTag>({
	domains: {
		en: "https://example.com",
		de: "https://example.de",
		fr: "https://fr.example.com",
	},
})
```

Domains must be unique for each language.

### Detection-only Strategy

This strategy exclusively uses the `Accept-Language` header to detect the language on first visit. Any subsequent visits will use the language set in the `NEXT_LOCALE` cookie. Routing is not affected in any way.

```ts
import { DetectionStrategy } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"

const strategy = DetectionStrategy<AvailableLanguageTag>()
```

> Manual Language switches only work if JS is enabled when using this strategy.
