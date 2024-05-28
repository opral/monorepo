import "@/lib/ui/styles.css"
import { AvailableLanguageTag, availableLanguageTags, languageTag } from "@/paraglide/runtime"
import * as m from "@/paraglide/messages.js"
import type { Metadata, ResolvingMetadata } from "next"
import { initializeLocaleCache, makeLocaleAvailable } from "@/lib/localeCache"
import { ClientProvider } from "@/lib/ClientProvider"
import { Header } from "@/lib/ui/Header"
import { strategy } from "@/lib/i18n"
import { generateAlternateLinks } from "@inlang/paraglide-next"

makeLocaleAvailable()

export function generateMetadata(props: never, parent: ResolvingMetadata): Metadata {
	const locale = languageTag()
	return {
		title: m.paraglide_and_next_app_router(),
		description: m.this_app_was_localised_with_paraglide(),
		icons: "/favicon.png",
		openGraph: {
			locale,
		},
		alternates: {
			languages: generateAlternateLinks({
				base: "https://example.com",
				strategy,
				resolvingMetadata: parent,
			}),
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
