import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { languageTag } from "@/paraglide/runtime"
import { LanguageSwitcher } from "@/lib/LanguageSwitcher"
import { headers } from "next/headers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	console.log(headers())
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>
					<LanguageSwitcher />
					{children}
				</body>
			</html>
		</LanguageProvider>
	)
}
