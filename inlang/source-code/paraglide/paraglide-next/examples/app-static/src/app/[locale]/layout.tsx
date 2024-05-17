import "@/lib/ui/styles.css"
import {
	AvailableLanguageTag,
	availableLanguageTags,
	languageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime"
import { Header } from "@/lib/ui/Header"
import * as m from "@/paraglide/messages.js"
import type { Metadata } from "next"

export function generateMetadata(): Metadata {
	const locale = languageTag()
	return {
		title: m.paraglide_and_next_app_router(),
		description: m.this_app_was_localised_with_paraglide(),
		icons: "/favicon.png",
		openGraph: {
			locale,
		},
	}
}

export async function generateStaticParams() {
	return availableLanguageTags.map((locale) => ({ locale }))
}

const direction: Record<AvailableLanguageTag, "ltr" | "rtl"> = {
	en: "ltr",
	"de-CH": "ltr",
	de: "ltr",
}

export default function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: { locale: AvailableLanguageTag }
}) {
	console.log("locale", params.locale)
	setLanguageTag(params.locale || sourceLanguageTag)

	return (
		<html lang={languageTag()} dir={direction[languageTag()]}>
			<body>
				<Header />
				<main className="container">{children}</main>
			</body>
		</html>
	)
}
