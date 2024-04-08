//vendored in from sveltekit

const param_pattern = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/

interface RouteParam {
	name: string
	matcher: string
	optional: boolean
	rest: boolean
	chained: boolean
}

export function parse_route_id(id: string) {
	const params: RouteParam[] = []

	const pattern =
		id === "/"
			? /^\/$/
			: new RegExp(
					`^${get_route_segments(id)
						.map((segment) => {
							// special case — /[...rest]/ could contain zero segments
							const rest_match = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(segment)
							if (rest_match) {
								params.push({
									name: rest_match[1] as string,
									matcher: rest_match[2] as string,
									optional: false,
									rest: true,
									chained: true,
								})
								return "(?:/(.*))?"
							}
							// special case — /[[optional]]/ could contain zero segments
							const optional_match = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(segment)
							if (optional_match) {
								params.push({
									name: optional_match[1] as string,
									matcher: optional_match[2] as string,
									optional: true,
									rest: false,
									chained: true,
								})
								return "(?:/([^/]+))?"
							}

							if (!segment) return

							const parts = segment.split(/\[(.+?)\](?!\])/)
							const result = parts
								.map((content, i) => {
									if (i % 2) {
										if (content.startsWith("x+")) {
											return escape(String.fromCharCode(parseInt(content.slice(2), 16)))
										}

										if (content.startsWith("u+")) {
											return escape(
												String.fromCharCode(
													...content
														.slice(2)
														.split("-")
														.map((code) => parseInt(code, 16))
												)
											)
										}

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

										params.push({
											name: name as string,
											matcher: matcher as string,
											optional: !!is_optional,
											rest: !!is_rest,
											chained: is_rest ? i === 1 && parts[0] === "" : false,
										})
										return is_rest ? "(.*?)" : is_optional ? "([^/]*)?" : "([^/]+?)"
									}

									return escape(content)
								})
								.join("")

							return "/" + result
						})
						.join("")}/?$`
			  )

	return { pattern, params }
}

export function get_route_segments(route: string) {
	return route.slice(1).split("/")
}
