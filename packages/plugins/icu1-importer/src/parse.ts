import {
	parse as parseICU,
	TYPE,
	type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser"
import type { MessageNested, Option, Pattern } from "@inlang/sdk2"

/**
 * Represents a (partial) branch
 */
type Branch = {
	/**
	 * The (partial) Pattern that this branch results in
	 */
	pattern: Pattern

	/**
	 * The (partial) match-values that are needed to produce this branch
	 * [arg, function?, match]
	 */
	match: [string, string | undefined, string][]
}

export const NULL_BRANCH: Branch = { pattern: [], match: [] }

/**
 * Takes in an ICU1 AST and returns all the branches it could generate
 * @param elements An array of AST elements
 * @param branch The current branch (pass a copy, may accidentally mutate)
 */
export function generateBranches(elements: MessageFormatElement[], branch: Branch): Branch[] {
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
					[TYPE.time]: "time",
					[TYPE.number]: "number",
					[TYPE.date]: "date",
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
							const exact = element.value.slice(1)
							selector = [element.value, undefined, exact]
						} else {
							selector = [element.value, "plural", option]
						}
					}

					for (const existingBranch of branches) {
						const newBranchesForBranch = generateBranches(
							optionValue.value,
							structuredClone({
								...existingBranch,
								match: selector ? [...existingBranch.match, selector] : existingBranch.match,
							})
						)
						newBranches.push(...newBranchesForBranch)
					}
				}

				branches = newBranches
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

export function parse(messageSource: string): Omit<MessageNested, "id" | "locale" | "bundleId"> {
	const ast = parseICU(messageSource)

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

	const message: Omit<MessageNested, "id" | "locale" | "bundleId"> = {
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
		variants: [],
	}

	return message
}
