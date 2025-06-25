---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# React Router v7 (framework) example

This example shows how to use Paraglide with React Router v7. The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/react-router).

## Getting started

1. Init Paraglide JS

```bash
npx @inlang/paraglide-js@latest init 
```

2. Add the vite plugin to your `vite.config.ts`:

```diff
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
+import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		reactRouter(),
+		paraglideVitePlugin({
+			project: "./project.inlang",
+			outdir: "./app/paraglide",
+		}),
	],
});
```

3. Done :) 

Run the app and start translating. See the [basics documentation](/m/gerre34r/library-inlang-paraglideJs/basics) for information on how to use Paraglide's messages, parameters, and locale management.

## Server side rendering using middleware

In your middleware file:
```ts
import { paraglideMiddleware } from "~/paraglide/server";
import type { Route } from "../+types/root";

const localeMiddleware: Route.unstable_MiddlewareFunction = async (
  { request },
  next,
) => {
  return await paraglideMiddleware(request, () => {
    return next();
  }, { onRedirect: (response) => throw response });
};

export { localeMiddleware };

```

In `root.tsx`:
```ts
export const unstable_middleware = [localeMiddleware];
```

In `routes.ts`: 

```diff
import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	// prefixing each path with an optional :locale
	// optional to match a path with no locale `/page`
	// or with a locale `/en/page`
	//
	// * make sure that the pattern you define here matches
	// * with the urlPatterns of paraglide JS if you use
	// * the `url` strategy
+	...prefix(":locale?", [
		index("routes/home.tsx"),
		route("about", "routes/about.tsx"),
+	]),
] satisfies RouteConfig;
```

Now you can use `getLocale` function anywhere in your project.

## Server side rendering without middleware

If you use React Router v7 with SSR you will need to add the following code:

In `root.tsx`:

```diff
import {
	assertIsLocale,
	baseLocale,
	getLocale,
	isLocale,
	overwriteGetLocale,
} from "./paraglide/runtime";

+export function loader(args: Route.LoaderArgs) {
+	return {
		// detect the locale from the path. if no locale is found, the baseLocale is used.
		// e.g. /de will set the locale to "de"
+		locale: isLocale(args.params.locale) ? args.params.locale : baseLocale,
+	};
}

// server-side rendering needs to be scoped to each request
// react context is used to scope the locale to each request
// and getLocale() is overwritten to read from the react context
+const LocaleContextSSR = createContext(baseLocale);
+if (import.meta.env.SSR) {
+	overwriteGetLocale(() => assertIsLocale(useContext(LocaleContextSSR)));
+}

export default function App(props: Route.ComponentProps) {
	return (
		// use the locale
+		<LocaleContextSSR.Provider value={props.loaderData.locale}>
			<Outlet />
+		</LocaleContextSSR.Provider>
	);
}
```

In `routes.ts`: 

```diff
import {
	type RouteConfig,
	index,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	// prefixing each path with an optional :locale
	// optional to match a path with no locale `/page`
	// or with a locale `/en/page`
	//
	// * make sure that the pattern you define here matches
	// * with the urlPatterns of paraglide JS if you use
	// * the `url` strategy
+	...prefix(":locale?", [
		index("routes/home.tsx"),
		route("about", "routes/about.tsx"),
+	]),
] satisfies RouteConfig;
```