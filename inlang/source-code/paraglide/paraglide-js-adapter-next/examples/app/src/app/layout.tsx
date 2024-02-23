import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { languageTag } from "@/paraglide/runtime"
import { LanguageSwitcher } from "@/lib/LanguageSwitcher"
import { SelectLanguage } from "@/lib/SelectLanguage"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>
					<LanguageSwitcher />
					<SelectLanguage />
					{children}
				</body>
			</html>
		</LanguageProvider>
	)
}
