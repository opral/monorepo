# Localised Routing

## Routing Strategy

A "Routing Strategy" defines how the localised routing is supposed to work in your App. 

It's an interface for providing a two-way mapping between 
 
Most of the time you will not be writing your own Routing Strategy & instead be using a prebuilt one.

- [Prefix Strategy (default)](prefix-strategy)
- [Domain Strategy](domain-strategy)

## Localised Navigation APIs

NextJS offers several Navigation APIs. `useRouter`, `usePathname`, `redirect`, `permanentRedirect` and of course the `Link` component. We can get localised versions of these using the `Navigation({ strategy })` constructor.

By default this is done in `src/lib/i18n.ts`

```ts
// src/lib/i18n.ts
import { Navigation, Middleware, PrefixStrategy } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"

const strategy = PrefixStrategy<AvailableLanguageTag>()

export const { Link, useRouter, usePathname, redirect, permanentRedirect } = Navigation({
    strategy,
})
```

We can then use these localised navigation APIs throughout our App.

```tsx
import { Link } from "@/lib/i18n"

<Link
    href="/"
    className="text-blue-500 hover:text-blue-700"
>
    {m.home_title()}
</Link>
```

### Linking to Pages in Specific Languages

If you want a Link to be in a specific language you can use the `locale` prop.

```tsx
<Link href="/about" locale="de">
```

This is convenient for constructing language switchers.

If you are using `router.push` to navigate you can pass `locale` as an option.

```ts
function Component() {
	const router = useRouter()
	return (
		<button onClick={() => router.push("/about", { locale: "de" })}>Go to German About page</button>
	)
}
```


## Manually Routing

There are situations where you need to manually get a localized URL. You can do this by calling the `getLocalisedUrl` method on your Routing Strategy. This will return an UrlObject.

```ts
import { strategy } from "@/lib/i18n"

const { parhname } = strategy.getLocalisedUrl(
    // the pathname you want to localise
    "/about", 

    //the language you want to localise to
    "de"

    // If the URL is in a different language than the current
    // Setting this is never harmful but may result in longer URLs
    true 
)
```