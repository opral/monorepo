# Manual Pages Router Setup

Ideally you would use the `@inlang/paraglide-next init` command to initialize your app, but in case that fails for some reason or if you're updating from an older version we also provide manual setup instructions. 

## 1. Install Dependencies

```bash
(p)npm install @inlang/paraglide-next
``` 

## 2. Create an Inlang Project

The Inlang Project manages your localisation settings and messages. You can initialize one with the `@inlang/paraglide-js init` command.

```bash
npx @inlang/paraglide-js init
```


## 3. Add the Paraglide-Next Plugin

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

## 4. Set up i18n routing

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

## 5. Add the ParaglideJS Provider

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