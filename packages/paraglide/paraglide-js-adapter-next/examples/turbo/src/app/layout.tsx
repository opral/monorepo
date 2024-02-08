import { languageTag } from "@/paraglide/runtime"
import { LanguageSwitcher } from "@/lib/LanguageSwitcher"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang={languageTag()}>
			<body>
				<LanguageSwitcher />
				{children}
			</body>
		</html>
	)
}
