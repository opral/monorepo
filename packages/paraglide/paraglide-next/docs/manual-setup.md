# Manual Setup

Ideally you would use the `@inlang/paraglide-next init` command to initialize your app, but in case that fails for some reason or if you're updating from an older version we also provide manual setup instructions. 

## App Router

### 1. Install Dependencies

```bash
(p)npm install @inlang/paraglide-next
```

### 2. Create an Inlang Project

The Inlang Project manages your localisation settings and messages. You can initialize one with the `@inlang/paraglide-js init` command.

```bash
npx @inlang/paraglide-js init
```

### 3. Add the Paraglide-Next Plugin

In `next.config.mjs` use the Paraglide-Next plugin. This will make sure to re-run the compiler whenever necessary and make any necessary virtual modules available.

In `next.config.mjs` add the following:

```ts
import { paraglide } from '@inlang/paraglide-next/plugin'
 
/** @type {import('next').NextConfig} */
const nextConfig = {
// your usual next config
}
 
export default paraglide({
  paraglide: {
    project: './project.inlang',
    outdir: './paraglide'
  },
  ...nextConfig
})
```

> If you're still using `next.config.js` it's recommended that you switch the config over to `next.config.mjs`

### 4. Add the necessary files

You need to create two files.

```ts
// src/lib/i18n.ts
import { Navigation, Middleware, PrefixStrategy } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages"

export const strategy = PrefixStrategy<AvailableLanguageTag>()

export const middleware = Middleware({ strategy })
export const { Link, useRouter, usePathname, redirect, permanentRedirect } = Navigation({ strategy })
```

```ts
// src/middleware.ts
export { middleware } from "@/lib/i18n"
```

### 5. Add the Language Provider

Add the LanguageProvider component. It will make the language available on the server. Also set the `lang` attribute to the current language.

```tsx
// src/app/root.tsx
import { LanguageProvider } from "@inlang/paraglide-next"
import { languageTag } from "@/paraglide/runtime.js"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>
					<main className="container">{children}</main>
				</body>
			</html>
		</LanguageProvider>
	)
}
```

> You may have to start your dev server once before `@/paraglide/runtime.js` is available

### 6. Set up i18n routing

Finally, go through your existing app code & use the localised versions of the different navigation APIs exported from `@/lib/i18n`

```diff
- import Link from "next/link"
+ import { Link } from "@/lib/i18n"

- import { useRouter, usePathname } from "next/navigation"
+ import { useRouter, usePathname } from "@/lib/i18n"
```

## Pages Router

Ideally you would use the `@inlang/paraglide-next init` command to initialize your app, but in case that fails for some reason or if you're updating from an older version we also provide manual setup instructions. 

### 1. Install Dependencies

```bash
(p)npm install @inlang/paraglide-next
``` 

### 2. Create an Inlang Project

The Inlang Project manages your localisation settings and messages. You can initialize one with the `@inlang/paraglide-js init` command.

```bash
npx @inlang/paraglide-js init
```


### 3. Add the Paraglide-Next Plugin

In `next.config.mjs` use the Paraglide-Next plugin. This will make sure to re-run the compiler whenever necessary and make any necessary virtual modules available.

In `next.config.mjs` add the following:

```ts
import { paraglide } from '@inlang/paraglide-next/plugin'
 
/** @type {import('next').NextConfig} */
const nextConfig = {
// your usual next config
}
 
export default paraglide({
  paraglide: {
    project: './project.inlang',
    outdir: './paraglide'
  },
  ...nextConfig
})
```

> If you're still using `next.config.js` it's recommended that you switch the config over to `next.config.mjs`

### 4. Set up i18n routing

The Pages router comes with [i18n routing out of the box](https://nextjs.org/docs/pages/building-your-application/routing/internationalization). Paraglide simply hooks into that for language detection & routing. 

Set it up in `next.config.mjs`:

```ts
import { paraglide } from '@inlang/paraglide-next/plugin'
 
/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n: {
        locales: ['en', 'de-CH'],
        defaultLocale: 'en'
    }
}
 
export default paraglide({
  paraglide: {
    project: './project.inlang',
    outdir: './paraglide'
  },
  ...nextConfig
})
```

### 5. Add the ParaglideJS Provider

Finally, add the ParaglideJS component to your `_app.tsx` file.

```tsx
// src/pages/_app.tsx
import type { AppProps } from "next/app"
import { ParaglideJS } from "@inlang/paraglide-next/pages"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ParaglideJS>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
```