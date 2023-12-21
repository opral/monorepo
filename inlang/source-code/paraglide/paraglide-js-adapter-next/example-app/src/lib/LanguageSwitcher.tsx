"use client"
import { availableLanguageTags } from "@/paraglide/runtime"
import { Link } from "@inlang/paraglide-js-adapter-next"
import { usePathname } from "next/navigation"

export function LanguageSwitcher() {
	const pathname = usePathname()
	return availableLanguageTags.map((lang) => (
		<>
			<Link href={pathname} locale={lang} key={lang}>
				{lang}
			</Link>
			<br />
		</>
	))
}
