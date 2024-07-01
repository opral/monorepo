import type { Pattern } from "@inlang/sdk/v2"

const patterToString = (props: { pattern: Pattern }): string => {
	if (!props.pattern) {
		return ""
	}
	return props.pattern
		.map((p) => {
			if ("value" in p) {
				return p.value
				// @ts-ignore
			} else if (p.type === "expression" && p.arg.type === "variable") {
				// @ts-ignore
				return `{{${p.arg.name}}}`
			}
			return ""
		})
		.join(" ")
}

export default patterToString
