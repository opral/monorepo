import { availableLanguageTags, languageTag, setLanguageTag } from "@/paraglide/runtime.js"
import { LanguageProvider } from "./LanguageProvider"

export function generateStaticParams() {
	return availableLanguageTags.map((lang) => ({ lang }))
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang={languageTag()}>
			<LanguageProvider>
				<body>{children}</body>
			</LanguageProvider>
		</html>
	)
}
