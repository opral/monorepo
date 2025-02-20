import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { setLocale } from "./paraglide/runtime";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<div style={{ display: "flex", gap: 10 }}>
					<p>Change locale to </p>
					<button onClick={() => setLocale("en")}>en</button>
					<button onClick={() => setLocale("de")}>de</button>
				</div>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	// @ts-ignore
	return <Outlet />;
}
