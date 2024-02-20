import React from "react"
import Header from "./Header"
import { Paraglide } from "../paraglide"

export default function ParaglideJS<T extends string>(props: {
	runtime: Paraglide<T>
	language?: string //this intentionally isn't T because Next's types arent as strict as ours
	children: React.ReactNode
}): React.ReactNode {
	const { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag, availableLanguageTags } =
		props.runtime

	if (isAvailableLanguageTag(props.language)) {
		setLanguageTag(props.language)
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
