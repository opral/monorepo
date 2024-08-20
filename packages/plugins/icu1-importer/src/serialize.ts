import type { MessageNested, Pattern } from "@inlang/sdk2"
import { TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser"

type Branch = {
	/**
	 * The (partial) Pattern that this branch results in
	 */
	pattern: Pattern

	/**
	 * The (partial) match-values that are needed to produce this branch
	 * [arg, function?, match]
	 *
	 * Add options?
	 */
	match: {
		arg: string
		function?: string // todo: add options?
		match: string
	}[]
}

export function serializeMessage(message: MessageNested): string {
	const branches = getBranches(message)
	if (branches.length < 1) return "" // shouldn't happen, just being safe

	const ast = branchesToICU1(branches)
	return serializeICU1Message(ast)
}

/**
 * Turns the variants into branches that we can work with more easily.
 *
 * Branches contain the information of both the variant and the selectors, so they're easier to
 * work with than just variants.
 */
function getBranches(message: MessageNested): Branch[] {
	const branches: Branch[] = []
	for (const variant of message.variants) {
		const match: Branch["match"] = []

		for (let i = 0; i < message.selectors.length; i++) {
			const selector = message.selectors[i]
			const match = variant.match[i]
			if (match === "*") continue
			if (selector?.arg.type !== "variable") continue

			const arg = selector?.arg.name
			const fnName = selector?.annotation?.name

			match.push({
				arg,
				function: fnName,
				match: match,
			})
		}

		const branch: Branch = {
			pattern: variant.pattern,
			match,
		}

		branches.push(branch)
	}

	return branches
}

function branchesToICU1(branches: Branch[]): MessageFormatElement[] {
	const elements: MessageFormatElement[] = []

	// group branches by their next element

	// Two cases
	// 1. All the branches in one group -> append the element to the result
	// 2. Not all the branches in one group -> discriminate by selectors

	return elements
}

/**
 * @param element An ICU1 ast
 * @returns The serialized ICU1 MessageFormat string
 */
function serializeICU1Message(element: MessageFormatElement[]): string {
	// TODO
}
