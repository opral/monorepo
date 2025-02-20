import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import type React from "react";
import { createContext, useContext } from "react";
import {
	assertIsLocale,
	baseLocale,
	getLocale,
	isLocale,
	overwriteGetLocale,
} from "./paraglide/runtime";

export function loader(args: Route.LoaderArgs) {
	return {
		// detect the locale from the path. if no locale is found, the baseLocale is used.
		// e.g. /de will set the locale to "de"
		locale: isLocale(args.params.locale) ? args.params.locale : baseLocale,
	};
}

// server-side rendering needs to be scoped to each request
// react context is used to scope the locale to each request
// and getLocale() is overwritten to read from the react context
const LocaleContextSSR = createContext(baseLocale);
if (import.meta.env.SSR) {
	overwriteGetLocale(() => assertIsLocale(useContext(LocaleContextSSR)));
}

export default function App(props: Route.ComponentProps) {
	return (
		// use the locale
		<LocaleContextSSR.Provider value={props.loaderData.locale}>
			{/* @ts-ignore */}
			<Outlet />
		</LocaleContextSSR.Provider>
	);
}

export function Layout(props: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{props.children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}