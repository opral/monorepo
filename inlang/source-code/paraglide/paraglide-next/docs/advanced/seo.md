# SEO 

## Translated Metadata

You'll likely want to have metadata in different languages. 

You can use messages in metadata just like everywhere else, as long as you're using `generateMetadata` instead of exporting `metadata`

```ts
export async function generateMetadata() {
	return {
		title: m.home_metadata_title(),
		description: m.home_metadata_description(),
	}
}
```


> If you were to use `export const metadata` your metadata would always end up in the source language.


## Alternate Links / Sitemap

Search engines like Google expect you to tell them about translated versions of your pages. Paraglide-Next does this by default by adding the `Link` Header to requests.

You **don't** need to add the translated versions of your site to your sitemap, although it doesn't hurt if you do. Adding one language is sufficient.

## Right-to-Left Support

Just define a map of all languages to their text-direction & index into it.

```tsx
// src/app/layout.tsx
import { languageTag, type AvailableLanguageTag } from "@/paraglide/runtime.js"

// This is type-safe & forces you to keep it up-to-date
const direction: Record<AvailableLanguageTag, "rtl" | "ltr"> = {
	en: "ltr",
	ar: "rtl",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()} dir={direction[languageTag()]}>
	//...
```

> For now we discourage using the `Intl.Locale` API to detect text-direction as it's still poorly supported
