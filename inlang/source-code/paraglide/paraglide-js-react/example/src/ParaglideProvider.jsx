import { onSetLanguageTag } from "@inlang/paraglide-js"
import { useState } from "react"

let onChangeLanguageTagAlreadySet = false

export default (props) => {
	const [langTag, setLangTag] = useState()

	if (!onChangeLanguageTagAlreadySet) {
		onSetLanguageTag((newLangTag) => {
			setLangTag(newLangTag)
		})
		onChangeLanguageTagAlreadySet = true
	}

	return <div key={langTag}>{props.children}</div>
}
