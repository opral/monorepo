import { availableLanguageTags } from "@/paraglide/runtime"
import Link from "next/link"
import { useRouter } from "next/router"

/**
 * A simple language switcher that links to the same page in all available languages.
 */
export function LocaleSwitcher() {
	const { asPath } = useRouter()
	return (
		<>
			{availableLanguageTags.map((lang) => {
				return (
					<Link href={asPath} locale={lang} style={{ marginRight: 2 }} key={lang}>
						{lang}
					</Link>
				)
			})}
		</>
	)
}
