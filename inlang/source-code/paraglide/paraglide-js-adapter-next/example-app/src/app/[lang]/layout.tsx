import {
	AvailableLanguageTag,
	availableLanguageTags,
	languageTag,
	setLanguageTag,
} from "@/paraglide/runtime.js"

export function generateStaticParams() {
	return availableLanguageTags.map((lang) => ({ lang }))
}

export default function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: { lang: AvailableLanguageTag }
}) {
	if (availableLanguageTags.includes(params.lang)) {
		setLanguageTag(params.lang)
	}

	return (
		<html lang={languageTag()}>
			<body>{children}</body>
		</html>
	)
}
