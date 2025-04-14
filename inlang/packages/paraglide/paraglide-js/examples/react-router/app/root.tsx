import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { getLocale } from "./paraglide/runtime";

export default function App() {
	return (
		<Outlet />
	);
}

export function Layout(props: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{props.children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}