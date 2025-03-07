---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Next JS SSG example

This is an example of how to use Paraglide with Next JS with SSG. The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/next-js-ssg).

<doc-callout type="tip">NextJS is tech-debt plagued. If you start your app or website from scratch, we highly recommend using a vite-based framework. [Read](https://github.com/opral/inlang-paraglide-js/issues/245#issuecomment-2608727658) this comment. </doc-callout>

## Features

| Feature      | Supported |
| ------------ | --------- |
| CSR          | ✅        |
| SSR          | ✅        |
| SSG          | ✅        |
| URLPattern   | ❌        |
| Any Strategy | ❌        |

<doc-callout type="warning">The SSG example is relies on having the locale prefixed in the path like `/en/page`.</doc-callout>

<doc-callout type="tip">Pull requests that improve this example are welcome.</doc-callout>

## Getting started

### Install paraglide js

```bash
npx @inlang/paraglide-js@beta init
```

### Add the webpack plugin to the `next.config.js` file:

<doc-callout type="info">The URL Pattern ensures that `localizeHref()` includes the locale in the path.</doc-callout>

```diff
import { paraglideWebpackPlugin } from "@inlang/paraglide-js";

/**
 * @type {import('next').NextConfig}
 */
export default {
+	webpack: (config) => {
+		config.plugins.push(
+			paraglideWebpackPlugin({
+				outdir: "./src/paraglide",
+				project: "./project.inlang",
+       strategy: ["url", "cookie", "baseLocale"],
+				urlPatterns: [
+					{
+						pattern:
+							":protocol://:domain(.*)::port?/:locale(de|en)?/:path(.*)?",
+						deLocalizedNamedGroups: {
+							locale: "en",
+						},
+						localizedNamedGroups: {
+							de: { locale: "de" },
+							en: { locale: "en" },
+						},
+					},
+				],
+			})
+		);
+		return config;
	},
};
```

### Create a `[locale]` folder and move all of your pages in there

```
app/
  - [locale]/
    - index.tsx
    - about.tsx
    - ...
```

### Add the locale handling to your root layout

```diff
app/
  - [locale]/
    - index.tsx
+   - layout.tsx
    - about.tsx
    - ...
```

```diff

// needed for SSG
+export function generateStaticParams() {
+	return [{ locale: "en" }, { locale: "de" }];
+}

// scopes the locale per request
+let ssrLocale = cache(() => ({
+	locale: baseLocale,
+}));

// overwrite the getLocale function to use the locale from the request
+overwriteGetLocale(() => assertIsLocale(ssrLocale().locale));

export default async function RootLayout({
	children,
	params,
}: {
	children: any;
	params: any;
}) {
	// can't use async params because the execution order get's screwed up.
	// this is something nextjs has to fix
+	ssrLocale().locale = params.locale;
	return (
		<html lang={getLocale()}>
			<body>
				{children}
			</body>
		</html>
	);
}
```
