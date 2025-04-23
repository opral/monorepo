import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react"
import type { LinksFunction } from "@remix-run/node"
import { useEffect } from "react"
import { posthog } from "posthog-js"
import "./tailwind.css"

export async function loader() {
	return { PUBLIC_LIX_POSTHOG_TOKEN: process.env.PUBLIC_LIX_POSTHOG_TOKEN }
}

export const links: LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{
		rel: "icon",
		type: "image/x-icon",
		href: "/favicon.svg",
	},
]

export function Layout({ children }: { children: React.ReactNode }) {
	const env = useLoaderData<typeof loader>()

	useEffect(() => {
		if (env.PUBLIC_LIX_POSTHOG_TOKEN) {
			posthog.init(env.PUBLIC_LIX_POSTHOG_TOKEN, {
				api_host: "https://eu.i.posthog.com",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
			})
			posthog.capture("$pageview")
		} else {
			console.info("No posthog token found")
		}
		return () => posthog.reset()
	}, [])

	return (
		<>
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<Meta />
					<Links />
				</head>
				<body>
					<div className="min-h-screen">{children}</div>
					<ScrollRestoration />
					<Scripts />
				</body>
			</html>
		</>
	)
}

export default function App() {
	return <Outlet />
}
