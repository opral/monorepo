import "@/lib/ui/styles.css"
import { AvailableLanguageTag, availableLanguageTags, languageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages.js"
import type { Metadata } from "next"
import { initializeLocaleCache, makeLocaleAvailable } from "@/lib/localeCache"
import { ClientProvider } from "@/lib/ClientProvider"
import { Header } from "@/lib/ui/Header"
import { strategy } from "@/lib/i18n"
import { UrlObject, format, parse } from "node:url"

makeLocaleAvailable()

export function generateMetadata(props: never, parent: any): Metadata {
	const stuff = Object.getOwnPropertySymbols(parent)
		.map((symbol) => parent[symbol])
		.filter((thing) => typeof thing === "object")
		.filter((thing) => "urlPathname" in thing)
		.at(0)

	const locale = languageTag()

	//current pathname, rendered per page
	const localisedPathname = new URL(stuff.urlPathname, "https://n.com").pathname as `/${string}`
	const canonicalPathname = strategy.getCanonicalPath(localisedPathname, locale)

	return {
		title: m.paraglide_and_next_app_router(),
		description: m.this_app_was_localised_with_paraglide(),
		icons: "/favicon.png",
		openGraph: {
			locale,
		},
		alternates: {
			languages: Object.fromEntries(
				availableLanguageTags.map((lang) => {
					const localisedUrl = strategy.getLocalisedUrl(canonicalPathname, lang, true)
					const baseUrl: UrlObject = parse("https://example.com")
					const url = { ...baseUrl, ...localisedUrl }
					const href = format(url)

					return [lang, href]
				})
			),
		},
	}
}

export async function generateStaticParams() {
	return availableLanguageTags.map((locale) => ({ locale }))
}

export default function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: { locale: AvailableLanguageTag }
}) {
	initializeLocaleCache(params.locale)

	return (
		<>
			<ClientProvider languageTag={params.locale} />
			<html lang={languageTag()}>
				<body>
					<Header />
					<main className="container">{children}</main>
				</body>
			</html>
		</>
	)
}
