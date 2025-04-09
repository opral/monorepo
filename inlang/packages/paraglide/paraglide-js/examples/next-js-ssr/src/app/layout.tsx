import {
	assertIsLocale,
	baseLocale,
	getLocale,
	Locale,
	overwriteGetLocale,
	overwriteGetUrlOrigin,
} from "../paraglide/runtime";
import ClientSideLocaleSwitch from "./ClientSideLocaleSwitch";
import { m } from "../paraglide/messages.js";
import React, { cache } from "react";
import { headers } from "next/headers";

const ssrLocale = cache(() => ({
	locale: baseLocale,
	// needs to be localhost https://github.com/opral/inlang-paraglide-js/issues/407
	origin: "http://localhost",
}));

// overwrite the getLocale function to use the locale from the request
overwriteGetLocale(() => assertIsLocale(ssrLocale().locale));
overwriteGetUrlOrigin(() => ssrLocale().origin);

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// @ts-expect-error - headers must be sync
	// https://github.com/opral/inlang-paraglide-js/issues/245#issuecomment-2608727658
	ssrLocale().locale = headers().get("x-paraglide-locale") as Locale;
	// @ts-expect-error - headers must be sync
	ssrLocale().origin = new URL(headers().get("x-paraglide-request-url")).origin;

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