import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react"
import type { LinksFunction } from "@remix-run/node"
import { useEffect } from "react"
import { posthog } from "posthog-js"
import "./tailwind.css"
import Header from "./components/header"
import Footer from "./components/footer"
import IconArrowExternal from "./components/icons/arrow-external"

export async function loader() {
	return { PUBLIC_POSTHOG_TOKEN: process.env.PUBLIC_POSTHOG_TOKEN }
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
		if (typeof window !== "undefined" && env.PUBLIC_POSTHOG_TOKEN) {
			posthog.init(env.PUBLIC_POSTHOG_TOKEN ?? "", {
				api_host: import.meta.env.PROD ? "https://tm.inlang.com" : "http://localhost:4005",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
			})
			posthog.capture("$pageview")
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
					<div className="min-h-screen">
						<div className="flex justify-center items-center h-[50px] text-[16px] px-3 bg-slate-100 border-b border-slate-200 text-black font-medium">
							Public preview launching, Dec 16
							<a
								className="group text-cyan-600 hover:text-black border border-slate-200 mx-6 flex gap-2 items-center py-1 px-3 rounded-md bg-white"
								target="_blank"
								href="https://forms.gle/cR3iDsUB7DEygJaZ8"
							>
								Get notified
								<IconArrowExternal />
							</a>
						</div>
						<Header />
						{children}
						<Footer />
					</div>
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
