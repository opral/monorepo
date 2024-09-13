import {
	parse as parseICU,
	TYPE,
	type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser"
import type { MessageNested, Option, Pattern } from "@inlang/sdk2"

/**
 * Represents a (partial) branch
 *
 * ICU1 Messages can have multiple sequential brances, eg: Two plurals after another. A "branch" represents
 * one path through these. For example "one" on the first plural and "many" on the second.
 *
 * 1. The values each variables needs in order to trigger this branch
 * 2. The pattern that gets rendered if this branch is triggered.
 *
 * These branches get compiled to variants afterwards.
 */
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
	match: [string, string | undefined, string][]
}

export const NULL_BRANCH: Branch = { pattern: [], match: [] }

/**
 * Takes in an ICU1 AST and returns all the branches it could generate
 * @param elements An array of AST elements
 * @param branch The current branch (pass a copy, may accidentally mutate)
 */
export function generateBranches(
	elements: MessageFormatElement[],
	branch: Branch,
	poundReference: string | undefined = undefined
): Branch[] {
	let branches: Branch[] = [structuredClone(branch)]

	for (const element of elements) {
		switch (element.type) {
			case TYPE.literal: {
				for (const branch of branches) {
					branch.pattern.push({ type: "text", value: element.value })
				}
				break
			}
			case TYPE.argument: {
				for (const branch of branches) {
					branch.pattern.push({
						type: "expression",
						arg: { type: "variable", name: element.value },
					})
				}
				break
			}
			case TYPE.time:
			case TYPE.number:
			case TYPE.date: {
				let options: Option[] = []
				if (typeof element.style === "string") {
					options = [{ name: "style", value: { type: "literal", name: element.style } }]
				}
				if (typeof element.style === "object" && element.style) {
					options = Object.entries(element.style.parsedOptions).map(([key, value]) => ({
						name: key,
						value: { type: "literal", name: value },
					}))
				}

				const fnName = {
					[TYPE.time]: "datetime",
					[TYPE.number]: "number",
					[TYPE.date]: "datetime",
				} as const

				for (const branch of branches) {
					branch.pattern.push({
						type: "expression",
						arg: { type: "variable", name: element.value },
						annotation: {
							type: "function",
							name: fnName[element.type],
							options,
						},
					})
				}
				break
			}
			case TYPE.plural:
			case TYPE.select: {
				const newBranches: Branch[] = []

				for (const [option, optionValue] of Object.entries(element.options)) {
					let selector: Branch["match"][number] | undefined = undefined

					if (element.type === TYPE.select && option !== "other") {
						selector = [element.value, undefined, option]
					}

					if (element.type === TYPE.plural && option !== "other") {
						if (option.startsWith("=")) {
							const exact = option.slice(1) // remove the "=" before the number
							selector = [element.value, undefined, exact]
						} else {
							selector = [element.value, "plural", option]
						}
					}

					for (const existingBranch of branches) {
						const newBranchesForBranch = generateBranches(
							optionValue.value,
							{
								...existingBranch,
								match: selector ? [...existingBranch.match, selector] : existingBranch.match,
							},
							element.value
						)
						newBranches.push(...newBranchesForBranch)
					}
				}

				branches = newBranches
				break
			}
			case TYPE.pound: {
				for (const branch of branches) {
					if (poundReference) {
						branch.pattern.push({
							type: "expression",
							arg: {
								type: "variable",
								name: poundReference,
							},
						})
					} else {
						throw new Error("Unexpected pound element")
					}
				}
				break
			}
			case TYPE.tag:
			default: {
				throw new Error("Unkown element type " + element.type)
			}
		}
	}

	return branches
}

export function createMessage({
	messageSource,
	bundleId,
	locale,
}: {
	messageSource: string
	bundleId: string
	locale: string
}): MessageNested {
	const ast = parseICU(messageSource, {
		ignoreTag: true, // TODO: Change once we support markup
		requiresOtherClause: false,
		locale: new Intl.Locale(locale),
		shouldParseSkeletons: true,
	})
	const branches = generateBranches(ast, NULL_BRANCH)

	const inputs = new Set<string>()
	for (const branch of branches) {
		for (const elem of branch.pattern) {
			if (elem.type === "expression") {
				inputs.add(elem.arg.name)
			}
		}
		for (const selector of branch.match) {
			inputs.add(selector[0])
		}
	}

	// each unique pair of [variable, function] in the branche's matchers will become a selector
	const selectors: [string, string | undefined][] = []
	for (const branch of branches) {
		for (const [selectorVariable, selectorFunction] of branch.match) {
			const selector: [string, string | undefined] = [selectorVariable, selectorFunction]
			const alreadyExists = selectors.find((s) => s[0] === selector[0] && s[1] === selector[1])
			if (alreadyExists) continue
			else selectors.push(selector)
		}
	}

	const messageId = `${bundleId}_${locale}`

	const message: MessageNested = {
		id: messageId,
		bundleId,
		locale,
		declarations: [...inputs].map((name) => ({
			type: "input",
			name,
			value: { type: "expression", arg: { type: "variable", name } },
		})),
		selectors: selectors.map(([name, fn]) => ({
			type: "expression",
			arg: { type: "variable", name },
			annotation: fn ? { type: "function", name: fn, options: [] } : undefined,
		})),
		variants: branches.map((branch) => {
			const match = {}
			// TODO support named matchers
			// selectors.map(([name, fn]) => {
			// 	const matches = branch.match.find((m) => m[0] === name && m[1] === fn)
			// 	if (matches) return matches[2]
			// 	else return "*"
			// })

			// TODO support named matchers
			//const variantId = `${messageId}_${match.map((m) => (m === "*" ? "any" : m)).join("_")}`
			const variantId = `${messageId}_any`
			return {
				id: variantId,
				messageId,
				match,
				pattern: branch.pattern,
			}
		}),
	}

	return message
}
