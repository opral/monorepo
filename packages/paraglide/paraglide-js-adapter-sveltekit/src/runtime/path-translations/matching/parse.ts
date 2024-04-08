const param_pattern = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/
const optional_param_regex = /^\[\[(\w+)(?:=(\w+))?\]\]$/
const wildcard_param_regex = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/

export type ParamSegment = {
	type: "param"
	name: string
	matcher?: string
	optional: boolean
	rest: boolean
	chained: boolean
}

export type StaticSegment = {
	type: "static"
	value: string
}

export type Segment = ParamSegment | StaticSegment

export type PathDefinition = {
	segments: Segment[]
}

function get_route_segments(route: string) {
	return route.slice(1).split("/")
}

/**
 * A path definition has the form /foo/[id]/bar-[param]/[...slug]/baz
 * This parses the path definition so that it can be used to match against a path
 * @param definition
 */
export function parsePathDefinition(definition: string): Segment[] {
	if (definition == "/") return []

	const segments = get_route_segments(definition)
	const parts: Segment[] = []
	for (const segment of segments) {
		if (!segment) continue

		const rest_match = wildcard_param_regex.exec(segment)
		if (rest_match) {
			parts.push({
				type: "param",
				name: rest_match[1] as string,
				matcher: rest_match[2] as string,
				optional: false,
				rest: true,
				chained: true,
			})
			continue
		}

		const optional_match = optional_param_regex.exec(segment)
		if (optional_match) {
			parts.push({
				type: "param",
				name: optional_match[1] as string,
				matcher: optional_match[2] as string,
				optional: true,
				rest: false,
				chained: true,
			})
			continue
		}

		const segement_parts = segment.split(/\[(.+?)\](?!\])/)
		for (const [i, content] of segement_parts.entries()) {
			if (i % 2) {
				const match = /** @type {RegExpExecArray} */ param_pattern.exec(content)
				if (!match) {
					throw new Error(
						`Invalid param: ${content}. Params and matcher names can only have underscores and alphanumeric characters.`
					)
				}

				const [, is_optional, is_rest, name, matcher] = match

				// It's assumed that the following invalid route id cases are already checked
				// - unbalanced brackets
				// - optional param following rest param
				parts.push({
					type: "param",
					name: name as string,
					matcher: matcher as string,
					optional: !!is_optional,
					rest: !!is_rest,
					chained: is_rest ? i === 1 && segement_parts[0] === "" : false,
				})
			} else {
				if (content) {
					parts.push({
						type: "static",
						value: content,
					})
				}
			}
		}
	}

	return parts
}
