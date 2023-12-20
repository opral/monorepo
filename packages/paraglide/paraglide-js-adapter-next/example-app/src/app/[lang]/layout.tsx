import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import {
	AvailableLanguageTag,
	availableLanguageTags,
	isAvailableLanguageTag,
	languageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime"

export async function generateStaticParams() {
	return availableLanguageTags.map((lang) => ({ lang }))
}

export default function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: { lang: string }
}) {
	if (isAvailableLanguageTag(params.lang)) {
		setLanguageTag(params.lang as AvailableLanguageTag)
	}

	//The ParaglideNextAdapter component needs to come before any use of the `languageTag` function
	return (
		<LanguageProvider>
			<html lang={params.lang}>
				<body>{children}</body>
			</html>
		</LanguageProvider>
	)
}
