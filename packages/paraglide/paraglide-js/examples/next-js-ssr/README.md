---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Paraglide Next JS SSR example

This is an example of how to use Paraglide with Next JS with SSR.

## Features

| Feature      | Supported |
| ------------ | --------- |
| CSR          | ✅        |
| SSR          | ✅        |
| SSG          | ❌        |
| URLPattern   | ✅        |
| Any Strategy | ✅        |

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
+			})
+		);
+		return config;
	},
};
```

### Add the `serverMiddleware()` to `src/middleware.ts`

```diff
app/
  - index.tsx
+ - middleware.ts
  - about.tsx
  - ...
```

```ts
import { NextRequest, NextResponse } from "next/server";
import { serverMiddleware } from "./paraglide/runtime";

export function middleware(request: NextRequest) {
	return serverMiddleware(request, ({ request, locale }) => {
		request.headers.set("x-paraglide-locale", locale);
		return NextResponse.rewrite(request.url, request);
	});
}
```

### Add locale handling in the root layout

NextJS does not support AsyncLocalStorage. Hence, we need to use a workaround to render the correct locale. Please upvote this issue https://github.com/vercel/next.js/issues/69298.

<doc-callout type="info">The warning for "headers must be async" has no effect on production. NextJS needs to fix their API or introduce AsyncLocalStorage. More context here https://github.com/opral/inlang-paraglide-js/issues/245#issuecomment-2608727658</doc-callout>

```diff
+import {
+	assertIsLocale,
+	baseLocale,
+	getLocale,
+	Locale,
+	overwriteGetLocale,
+} from "../paraglide/runtime";
import React, { cache } from "react";
import { headers } from "next/headers";

+const ssrLocale = cache(() => ({ locale: baseLocale }));

// overwrite the getLocale function to use the locale from the request
+overwriteGetLocale(() => assertIsLocale(ssrLocale().locale));

export default async function RootLayout({
	children,
}) {
	// @ts-expect-error - headers must be sync
	// https://github.com/opral/inlang-paraglide-js/issues/245#issuecomment-2608727658
+	ssrLocale().locale = headers().get("x-paraglide-locale") as Locale;

	return (
		<html lang={getLocale()}>
			<body>
				{children}
			</body>
		</html>
	);
}
```
