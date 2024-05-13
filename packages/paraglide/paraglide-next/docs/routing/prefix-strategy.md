# Prefix Strategy (default)

This Routing Strategy adds a language prefix before the pathname to distinguish between different languages.

- `/de/some-page`
- `/fr/some-page`
- `/some-page` Default Language

```ts
import { PrefixStrategy } from "@inlang/paraglide-next"
const strategy = PrefixStrategy()
```

## Translated Pathnames

The Prefix Strategy supports using different pathnames for each language with the `pathname` option. 

- `/de/ueber-uns`
- `/fr/a-propos`
- `/ueber-uns`


Pathnames should not include a language prefix or the base path.

```ts
const strategy = PrefixStrategy<AvailableLanguageTag>({
	pathname: {
		"/about": {
			en: "/about",
			de: "/ueber-uns",
		},
	},
})
```

You can use parameters with square brackets. You have to use an identical set of parameters in both the canonical and translated pathnames.

You can use double-square brackets for optional parameters and the spread operator to make it a match-all parameter.

```ts
pathname: {
	"/articles/[slug]": {
		en: "/articles/[slug]",
		de: "/artikel/[slug]"
	},
	"/admin/[...rest]": {
		en: "/administration/[...rest]",
		de: "/admin/[...rest]"
	},
}
```

### Using Messages for Pathname translations

You can also use a message as a pathname. The translation will be used as the pathname. You can use parameters here too.

```json
// messages/en.json
{
	"about_pathname": "/about"
}
// messages/de.json
{
	"about_pathname": "/ueber-uns"
}
```

```ts
const strategy = PrefixStrategy<AvailableLanguageTag>({
	pathname: {
		"/about": m.about_pathname, //pass as reference
	},
})
```

## Excluding certain Routes from Localised Routing

You can exclude certain routes from i18n using the `exclude` option. Pass it a function that returns `true/false` depending on whether the given pathname should be excluded

```ts
const strategy = PrefixStrategy<AvailableLanguageTag>({
		exclude: (pathname) => pathname == "/api" || pathname.startsWith("/api/"),
})
```

Excluded routes won't be prefixed with the language tag & the middleware will not add `Link` headers to them.
