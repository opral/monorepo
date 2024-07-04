import "@/lib/ui/styles.css"
//import { Header } from "@/lib/ui/Header"
import { AvailableLanguageTag, availableLanguageTags, languageTag } from "@/paraglide/runtime"
import { LanguageProvider } from "@/lib/LanguageProvider"

/*
export function generateMetadata(props: never, parent: ResolvingMetadata): Metadata {
	return {
		title: m.paraglide_and_next_app_router(),
		description: m.this_app_was_localised_with_paraglide(),
		icons: "/favicon.png",
		alternates: {
			languages: generateAlternateLinks({
				origin: "https://example.com",
				strategy,
				resolvingMetadata: parent,
			}),
		},
	}
}
	*/

export async function generateStaticParams() {
	return availableLanguageTags.map((locale) => ({ locale }))
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
	params: { locale: AvailableLanguageTag }
}) {
	return (
		<>
			<LanguageProvider>
				<html lang={languageTag()}>
					<body>
						<main className="container">{children}</main>
					</body>
				</html>
			</LanguageProvider>
		</>
	)
}
