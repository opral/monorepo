import "@/lib/ui/styles.css"
import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { AvailableLanguageTag, languageTag } from "@/paraglide/runtime"
import { Header } from "@/lib/ui/Header"
import type { Metadata } from "next"

export function generateMetadata(): Metadata {
	return {
		title: "Paraglide App Router Example",
		description:
			"This is a NextJS App using the App router. It was localised using Paraglide and the ParaglideJS Adapter for NextJS.",
		icons: "/favicon.png",
	}
}

const direction: Record<AvailableLanguageTag, "ltr" | "rtl"> = {
	en: "ltr",
	"de-CH": "ltr",
	de: "ltr",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()} dir={direction[languageTag()]}>
				<body>
					<Header />
					<main className="container">{children}</main>
				</body>
			</html>
		</LanguageProvider>
	)
}
