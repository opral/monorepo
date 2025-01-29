// param type flags
// we use contsants instead of enums for better minification
const STATIC = 0b000;
const OPTIONAL = 0b001;
const REST = 0b010;
const REQUIRED = 0b100;

type Part = [
	/**
	 * type of part
	 */
	typeof STATIC | typeof REQUIRED | typeof OPTIONAL | typeof REST,

	/**
	 * content
	 * The text-value of the segment
	 * If this is not static this includes the brackets
	 */
	string,

	/**
	 * matched
	 *
	 * If this parameter includes a matcher.
	 */
	boolean,
];

const PART_TYPE = 0;
const PART_CONTENT = 1;
const PART_MATCHED = 2;

export function sort_routes(routes: string[]): string[] {
	const get_parts = cached(split);

	return routes.sort((route_a, route_b) => {
		const segments_a = split_route_id(route_a).map(get_parts);
		const segments_b = split_route_id(route_b).map(get_parts);

		for (
			let i = 0;
			i < Math.max(segments_a.length, segments_b.length);
			i += 1
		) {
			const segment_a = segments_a[i];
			const segment_b = segments_b[i];

			if (!segment_a) return -1;
			if (!segment_b) return +1;

			for (
				let j = 0;
				j < Math.max(segment_a.length, segment_b.length);
				j += 1
			) {
				const a = segment_a[j];
				const b = segment_b[j];

				// first part of each segment is always static
				// (though it may be an empty string), then
				// it alternates between dynamic and static
				// (i.e. [foo][bar] is disallowed)

				const dynamic = a?.[PART_TYPE] || b?.[PART_TYPE]; // type = 0 if STATIC, undefined if not present

				if (dynamic) {
					if (!a) return -1;
					if (!b) return +1;

					// Handle [...rest]
					const next_a =
						segment_a[j + 1]?.[PART_CONTENT] ||
						segments_a[i + 1]?.[0]?.[PART_CONTENT];
					const next_b =
						segment_b[j + 1]?.[PART_CONTENT] ||
						segments_b[i + 1]?.[0]?.[PART_CONTENT];

					const both_have_next = next_a && next_b;
					const only_a_has_next = next_a && !next_b;
					const only_b_has_next = !next_a && next_b;

					if ((a[PART_TYPE] && b[PART_TYPE]) === REST) {
						if (both_have_next) continue; // tied
						if (only_a_has_next) return -1;
						if (only_b_has_next) return +1;
					}

					if (a[PART_TYPE] === REST) return only_a_has_next ? -1 : +1;
					if (b[PART_TYPE] === REST) return only_b_has_next ? +1 : -1;

					// handle REQUIRED and OPTIONAL

					// part with matcher outranks one without
					if (a[PART_MATCHED] !== b[PART_MATCHED])
						return (-1) ** +a[PART_MATCHED];
					if (a[PART_TYPE] !== b[PART_TYPE]) {
						// Comparing between `[required]` and `[[optional]]`
						return (-1) ** +(a[PART_TYPE] > b[PART_TYPE]);
					}
				} else if (a?.[PART_CONTENT] !== b?.[PART_CONTENT]) {
					return sort_static(
						(a as Part)[PART_CONTENT],
						(b as Part)[PART_CONTENT]
					);
				}
			}
		}

		// in case of tie, sort alphabetically
		return route_a < route_b ? +1 : -1;
	});
}

/**
 * Returns a version of the function with a cache.
 */
function cached<T extends (arg: any) => any>(fn: T): T {
	const cache = new Map();
	return ((arg: Parameters<T>) => {
		if (!cache.has(arg)) cache.set(arg, fn(arg));
		return cache.get(arg);
	}) as T;
}

function split(id: string) {
	const parts: Part[] = [];

	let i = 0;
	while (i <= id.length) {
		const start = id.indexOf("[", i);
		const entirelyStatic = start === -1;
		parts.push([
			STATIC,
			id.slice(i, entirelyStatic ? undefined : start),
			false,
		]);
		if (entirelyStatic) break;

		const type =
			id[start + 1] === "["
				? OPTIONAL
				: id[start + 1] === "."
					? REST
					: REQUIRED;
		const endBrackets = type === OPTIONAL ? "]]" : "]";
		const endBracketIdx = id.indexOf(endBrackets, start);
		if (endBracketIdx === -1) throw new Error(`Invalid route definition ${id}`);

		const content = id.slice(start, (i = endBracketIdx + endBrackets.length));

		parts.push([type, content, content.includes("=")]);
	}

	return parts;
}

const split_route_id = (id: string) =>
	id
		// remove all [[optional]] parts unless they're at the very end
		.replace(/\[\[[^\]]+\]\](?!$)/g, "")
		.split("/")
		.filter(Boolean);

/**
 * Compares two strings lexicographically, except that the longer one wins.
 */
function sort_static(a: string, b: string): -1 | 0 | 1 {
	if (a === b) return 0; // this check prevents an infinite loop

	// move the cursor to the first non-equal character, or to the end of the shorter string
	let idx = 0;
	while (a[idx] === b[idx]) idx++;

	// if one of the strings is shorter than the other, the longer one wins
	// otherwise compare the first differing char
	return !a[idx]
		? +1
		: !b[idx]
			? -1
			: (a[idx] as string) < (b[idx] as string)
				? -1
				: +1;
}
