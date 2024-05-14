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


### Custom Strategy

The beatuy of the `RoutingStrategy` interface is that you can easily create your own routing strategy. All you need to do is implement the following functions:

```ts
const MyStrategy: RoutingStrategy<AvailableLanguageTag> = {
	/**
	 * This function get's a request & returns the language that should be used. 
	 * It's also OK to say you don't know & return undefined. In that case the Language Cookie will be used, 
	 * or Language negotiation if no cookie is present.
 	 */
	resolveLocale(request: NextRequest) : AvailableLanguageTag | undefined

	/**
	 * Returns the canonical pathname based on the localised pathname and it's language.
	 * 
	 * The canonical pathname is the pathname you would need to get to the page you want 
	 * in the `app/` directory if there weren't any i18n routing.
	 * 
	 * @example /de/ueber-uns + de -> /about
	 * 
	 */
	getCanonicalPath(localisedPath: `/${string}`, locale: AvailableLanguageTag): `/${string}`


	/**
	 * Returns the localized URL that can be used to navigate to the given path in the given language.
	 * It's a URL & not just a pathname so you can add query params and use other domains. 
	 * 
	 * For some strategies you might need to return different URLs based on if it's a language switch or not.
	 * 
	 * @example /about + de -> /de/ueber-uns
	 */
	getLocalisedUrl(canonicalPath: `/${string}`, targetLocale: AvailableLanguageTag, isLanugageSwitch: boolean)
		: import("url").UrlObject
}
```

To get some inspiration you might want to read the source-code of the built-in strategies. 