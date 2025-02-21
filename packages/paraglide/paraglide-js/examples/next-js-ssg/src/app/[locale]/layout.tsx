import {
	assertIsLocale,
	baseLocale,
	getLocale,
	overwriteGetLocale,
} from "../../paraglide/runtime";
import ClientSideLocaleSwitch from "./ClientSideLocaleSwitch";
import { m } from "../../paraglide/messages.js";
import React, { cache } from "react";

// needed for SSG
export function generateStaticParams() {
	return [{ locale: "en" }, { locale: "de" }];
}

// scopes the locale per request
const ssrLocale = cache(() => ({
	locale: baseLocale,
}));

// overwrite the getLocale function to use the locale from the request
overwriteGetLocale(() => assertIsLocale(ssrLocale().locale));

export default async function RootLayout({
	children,
	params,
}: {
	children: any;
	params: any;
}) {
	// can't use async params because the execution order get's screwed up.
	// this is something nextjs has to fix
	ssrLocale().locale = params.locale;
	return (
		<html lang={getLocale()}>
			<body>
				<b>
					<p>{m.programmatic_locale_switching_info()}</p>
				</b>
				<ClientSideLocaleSwitch />
				<hr />
				{children}
			</body>
		</html>
	);
}