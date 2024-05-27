import "@/lib/ui/styles.css"
import { AvailableLanguageTag, availableLanguageTags, languageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages.js"
import type { Metadata } from "next"
import { initializeLocaleCache, makeLocaleAvailable } from "@/lib/localeCache"
import { ClientProvider } from "@/lib/ClientProvider"
import { Header } from "@/lib/ui/Header"

makeLocaleAvailable()

export function generateMetadata(...args: any[]): Metadata {
	const stuff = Object.getOwnPropertySymbols(args[1])
		.map((symbol) => args[1][symbol])
		.filter((thing) => typeof thing === "object")
		.filter((thing) => "urlPathname" in thing)
		.at(0)

	//current pathname, rendered per page
	const urlPathname: string = stuff.urlPathname

	console.info("generateMetadata", urlPathname)
	const locale = languageTag()
	return {
		title: m.paraglide_and_next_app_router(),
		description: m.this_app_was_localised_with_paraglide(),
		icons: "/favicon.png",
		openGraph: {
			locale,
		},
		alternates: {
			languages: Object.fromEntries(availableLanguageTags.map((lang) => [lang, urlPathname])),
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
