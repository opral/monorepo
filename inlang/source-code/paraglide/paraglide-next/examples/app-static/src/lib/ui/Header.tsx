"use client"
import * as m from "@/paraglide/messages.js"
import { Link, usePathname } from "@/lib/i18n"
import { SelectLanguage } from "./SelectLanguage"
import { usePathname as useNextPathname } from "next/navigation"

export function Header() {
	const nextPathname = useNextPathname()
	const pathname = usePathname()

	return (
		<header
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				padding: "1rem",
				borderBottom: "1px solid #ccc",
			}}
		>
			<nav
				style={{
					display: "flex",
					gap: "1rem",
				}}
			>
				<Link aria-current={pathname == "/" ? "page" : undefined} href="/">
					{m.home()}
				</Link>
				<Link aria-current={pathname == "/about" ? "page" : undefined} href="/about">
					{m.about()}
				</Link>

				<Link href="/" locale="de">
					German Homepage
				</Link>

				<Link href="/" locale="en">
					German Homepage
				</Link>
			</nav>
			<div>{nextPathname}</div>

			<SelectLanguage />
		</header>
	)
}
