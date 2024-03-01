"use client"
import * as m from "@/paraglide/messages.js"
import { Link } from "@/lib/i18n"
import { SelectLanguage } from "./SelectLanguage"
import { usePathname } from "next/navigation"

export function Header() {
	const nextPathname = usePathname()

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
				<Link href="/">{m.home()}</Link>
				<Link href="/about">{m.about()}</Link>
			</nav>
			<div>{nextPathname}</div>

			<SelectLanguage />
		</header>
	)
}
