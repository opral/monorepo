"use client"
import { availableLanguageTags } from "@/paraglide/runtime"
import { Link } from "@inlang/paraglide-js-adapter-next/navigation"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

export function LanguageSwitcher() {
	const pathname = usePathname()
	return availableLanguageTags.map((lang) => (
		<Fragment key={lang}>
			<Link href={pathname} locale={lang}>
				{lang}
			</Link>
			<br />
		</Fragment>
	))
}
