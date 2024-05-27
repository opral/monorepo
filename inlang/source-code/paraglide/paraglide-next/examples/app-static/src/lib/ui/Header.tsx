"use client"
import * as m from "@/paraglide/messages.js"
import { Link, usePathname, useRouter } from "@/lib/i18n"
import { usePathname as useNextPathname } from "next/navigation"

export function Header() {
	const nextPathname = useNextPathname()
	const pathname = usePathname()
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const router = useRouter()

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
					English Homepage
				</Link>
			</nav>
			<div>{nextPathname}</div>
		</header>
	)
}
