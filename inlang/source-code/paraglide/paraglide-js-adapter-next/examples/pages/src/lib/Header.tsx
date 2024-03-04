import { LocaleSwitcher } from "./LocaleSwitcher"

export function Header() {
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
				{""}
			</nav>

			<LocaleSwitcher />
		</header>
	)
}
