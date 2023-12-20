import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { availableLanguageTags, languageTag } from "@/paraglide/runtime"

export async function generateStaticParams() {
	return availableLanguageTags.map((lang) => ({ lang }))
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>{children}</body>
			</html>
		</LanguageProvider>
	)
}
