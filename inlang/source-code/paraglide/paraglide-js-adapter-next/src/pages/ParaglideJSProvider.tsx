"use client"
import React from "react"
import Header from "./Header"
import { availableLanguageTags } from "$paraglide-adapter-next-internal/runtime.js"

export default function ParaglideJS(props: {
	runtime: typeof import("$paraglide-adapter-next-internal/runtime.js")
	language?: string
	children: React.ReactNode
}): React.ReactNode {
	const { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag, availableLanguageTags } =
		props.runtime

	if (isAvailableLanguageTag(props.language as string)) {
		setLanguageTag(props.language as string)
	} else {
		// dev only log
		if (process.env.NODE_ENV === "development") {
			console.error(
				`[paraglide]: "${props.language}" is not one of the available language tags. Falling back to "${sourceLanguageTag}"`
			)
		}

		setLanguageTag(sourceLanguageTag)
	}

	return (
		<>
			<Header availableLanguageTags={availableLanguageTags} sourceLanguageTag={sourceLanguageTag} />
			{props.children}
		</>
	)
}
