// param type flags
// we use contsants instead of enums for better minification
const STATIC = 0b000
const OPTIONAL = 0b001
const REST = 0b010
const REQUIRED = 0b100

type Part = {
	type: typeof STATIC | typeof REQUIRED | typeof OPTIONAL | typeof REST
	content: string
	matched: boolean
}

export function sort_routes(routes: string[]): string[] {
	const get_parts = cached(split)

	return routes.sort((route_a, route_b) => {
		const segments_a = split_route_id(route_a).map(get_parts)
		const segments_b = split_route_id(route_b).map(get_parts)

		for (let i = 0; i < Math.max(segments_a.length, segments_b.length); i += 1) {
			const segment_a = segments_a[i]
			const segment_b = segments_b[i]

			if (!segment_a) return -1
			if (!segment_b) return +1

			for (let j = 0; j < Math.max(segment_a.length, segment_b.length); j += 1) {
				const a = segment_a[j]
				const b = segment_b[j]

				// first part of each segment is always static
				// (though it may be an empty string), then
				// it alternates between dynamic and static
				// (i.e. [foo][bar] is disallowed)

				const dynamic = a?.type || b?.type // type = 0 if STATIC, undefined if not present

				if (dynamic) {
					if (!a) return -1
					if (!b) return +1

					// get the next static chunk, so we can handle [...rest] edge cases
					const next_a = (segment_a[j + 1]?.content || segments_a[i + 1]?.[0]?.content) as string
					const next_b = (segment_b[j + 1]?.content || segments_b[i + 1]?.[0]?.content) as string

					// `[...rest]/x` outranks `[...rest]`
					if (a.type && b.type === REST) {
						if (next_a && next_b) continue
						if (next_a) return -1
						if (next_b) return +1
					}

					// `[...rest]/x` outranks `[required]` or `[required]/[required]`
					// but not `[required]/x`
					if (a.type === REST) {
						return next_a && !next_b ? -1 : +1
					}

					if (b.type === REST) {
						return next_b && !next_a ? +1 : -1
					}

					// part with matcher outranks one without
					if (a.matched !== b.matched) {
						return a.matched ? -1 : +1
					}

					if (a.type !== b.type) {
						// `[...rest]` has already been accounted for, so here
						// we're comparing between `[required]` and `[[optional]]`
						if (a.type === REQUIRED) return -1
						if (b.type === REQUIRED) return +1
					}
				} else if (a?.content !== b?.content) {
					return sort_static((a as Part).content, (b as Part).content)
				}
			}
		}

		// in case of tie, sort alphabetically
		return route_a < route_b ? +1 : -1
	})
}

/**
 * Returns a version of the function with a cache.
 */
function cached<T extends (arg: any) => any>(fn: T): T {
	const cache = new Map()
	return ((arg: Parameters<T>) => {
		if (!cache.has(arg)) cache.set(arg, fn(arg))
		return cache.get(arg)
	}) as T
}

function split(id: string) {
	const parts: Part[] = []

	let i = 0
	while (i <= id.length) {
		const start = id.indexOf("[", i)
		const entirelyStatic = start === -1
		parts.push({
			type: STATIC,
			content: id.slice(i, entirelyStatic ? undefined : start),
			matched: false,
		})
		if (entirelyStatic) break

		const type = id[start + 1] === "[" ? OPTIONAL : id[start + 1] === "." ? REST : REQUIRED
		const endBrackets = type === OPTIONAL ? "]]" : "]"
		const endBracketIdx = id.indexOf(endBrackets, start)
		if (endBracketIdx === -1) throw new Error(`Invalid route definition ${id}`)

		const content = id.slice(start, (i = endBracketIdx + endBrackets.length))

		parts.push({
			type,
			content,
			matched: content.includes("="),
		})
	}

	return parts
}

const split_route_id = (id: string) =>
	id
		// remove all [[optional]] parts unless they're at the very end
		.replace(/\[\[[^\]]+\]\](?!$)/g, "")
		.split("/")
		.filter(Boolean)

/**
 * Compares two strings lexicographically, except that the longer one wins.
 */
function sort_static(a: string, b: string): -1 | 0 | 1 {
	if (a === b) return 0 // this check prevents an infinite loop

	// move the cursor to the first non-equal character, or to the end of the shorter string
	let c = 0
	while (a[c] === b[c]) c++

	// if one of the strings is shorter than the other, the longer one wins
	// otherwise compare the first differing char
	return !a[c] ? +1 : !b[c] ? -1 : (a[c] as string) < (b[c] as string) ? -1 : +1
}
