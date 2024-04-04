import React from "react"
import type { AppProps } from "next/app"
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next/pages"
import { Header } from "@/lib/Header"
import "@/lib/styles.css"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ParaglideJS>
			<Header />
			{/** @ts-ignore */}
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
