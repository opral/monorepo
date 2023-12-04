import LanguageProvider from "@/lib/LanguageProvider"
import { availableLanguageTags, languageTag } from "@/paraglide/runtime"

export async function generateStaticParams() {
	return availableLanguageTags.map((lang) => ({ lang }))
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	//The ParaglideNextAdapter component needs to come before any use of the `languageTag` function
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>{children}</body>
			</html>
		</LanguageProvider>
	)
}
