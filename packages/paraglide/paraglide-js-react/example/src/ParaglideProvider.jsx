import { onChangeLanguageTag } from "@inlang/paraglide-js"
import { useState } from "react"

let onChangeLanguageTagAlreadySet = false

export default (props) => {
	const [langTag, setLangTag] = useState()

	if (!onChangeLanguageTagAlreadySet) {
		onChangeLanguageTag((newLangTag) => {
			setLangTag(newLangTag)
		})
		onChangeLanguageTagAlreadySet = true
	}

	return <div key={langTag}>{props.children}</div>
}
