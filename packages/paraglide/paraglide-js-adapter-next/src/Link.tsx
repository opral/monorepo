import { languageTag } from "$paraglide-adapter-next-internal/runtime.js"
import { translatePath } from "./utils"
import NextLink from "next/link"
import React from "react"

export function Link(props: Parameters<typeof NextLink>[0]): ReturnType<typeof NextLink> {
	const lang = props.locale || languageTag()
	console.log("Link lang", lang)

	let href = props.href
	if (typeof props.href === "string") {
		href = translatePath(props.href, lang)
	}

	return <NextLink {...props} href={href} />
}
