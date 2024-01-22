const squareBracketRegex = /\[(.*?)\]/g

/**
 * A path definition has the form /foo/[id]/bar-[param]/[...slug]/baz
 * This parses the path definition so that it can be used to match against a path
 * @param definition
 */
export function parsePathDefinition(definition: string): PathDefinitionPart[] {
	const matches = definition.match(squareBracketRegex)

	if (!matches) {
		return [
			{
				type: "static",
				value: definition,
			},
		]
	}

	const parts: PathDefinitionPart[] = []
	let lastIndex = 0

	for (const match of matches) {
		const index = definition.indexOf(match, lastIndex)
		const staticPart = definition.slice(lastIndex, index)
		if (staticPart) {
			parts.push({
				type: "static",
				value: staticPart,
			})
		}

		const paramName = match.slice(1, -1)
		parts.push({
			type: "param",
			name: paramName,
		})

		lastIndex = index + match.length
	}

	const staticPart = definition.slice(lastIndex)

	if (staticPart) {
		parts.push({
			type: "static",
			value: staticPart,
		})
	}

	return parts
}

export type PathDefinitionPart =
	| {
			type: "param"
			name: string
	  }
	| {
			type: "static"
			value: string
	  }
