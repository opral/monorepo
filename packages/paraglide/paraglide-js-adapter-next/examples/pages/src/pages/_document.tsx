import React from "react"
import { languageTag } from "@/paraglide/runtime"
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
	return (
		<Html lang={languageTag()}>
			<Head />
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}
