/**
 * A path definition has the form /foo/[id]/bar/[...slug]/baz
 * This parses the path definition so that it can be used to match against a path
 * @param definition
 */
export function parsePathDefinition(definition: string): PathDefinitionPart[] {
	const definitionParts = definition.split("/").filter(Boolean)

	const parts: PathDefinitionPart[] = definitionParts.map((part): PathDefinitionPart => {
		if (isParam(part)) {
			let name = ""
			if (isCatchAllParam(part)) {
				name = part.replace(/[\[\]]/g, "").replace("...", "")
			} else {
				name = part.replace(/[\[\]]/g, "")
			}

			return {
				type: "param",
				name,
				optional: isOptionalParam(part),
				catchAll: isCatchAllParam(part),
			}
		} else {
			return {
				type: "static",
				value: part,
			}
		}
	})

	return parts
}

type PathDefinitionPart =
	| {
			type: "param"
			name: string
			optional: boolean
			catchAll: boolean
	  }
	| {
			type: "static"
			value: string
	  }

function isParam(part: string) {
	return part.startsWith("[") && part.endsWith("]")
}

function isCatchAllParam(part: string) {
	return part.startsWith("[...") && part.endsWith("]")
}

function isOptionalParam(part: string) {
	return part.startsWith("[[") && part.endsWith("]]")
}
