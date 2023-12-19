import {
	setLanguageTag,
	isAvailableLanguageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import React from "react"

export function ParaglideJS(props: {
	language?: string
	children: React.ReactNode
}): React.ReactNode {
	if (isAvailableLanguageTag(props.language as string)) {
		setLanguageTag(props.language as string)
	} else {
		// dev only log
		if (typeof window !== "undefined") {
			if (process.env.NODE_ENV === "development") {
				console.error(
					`[paraglide]: "${props.language}" is not one of the available language tags. Falling back to "${sourceLanguageTag}"`
				)
			}
		}
		setLanguageTag(sourceLanguageTag)
	}

	return <>{props.children}</>
}
