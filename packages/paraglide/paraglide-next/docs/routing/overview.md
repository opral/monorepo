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