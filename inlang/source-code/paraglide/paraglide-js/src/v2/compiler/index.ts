import type { ProjectSettings } from "@inlang/sdk"
import type {
	MessageBundle,
	Message,
	InputDeclaration,
	Declaration,
	Pattern,
	Expression,
	Variant,
} from "@inlang/sdk/v2"

export type CompileOptions = {
	messageBundles: Readonly<MessageBundle[]>
	settings: ProjectSettings
}

type CompiledMessage = {
	/**
	 * The language of the message
	 */
	locale: string

	/**
	 * The parameter-types of the message
	 */
	params: Record<string, string>

	/**
	 * The source-code for the message function
	 */
	source: string
}

export function compileMessage({
	message,
	bundleId,
}: {
	message: Message
	bundleId: string
}): CompiledMessage {
	const inputDeclarations = message.declarations.filter(isInputDeclaration)

	const inputsWithAnnotation = inputDeclarations.filter(
		(input) => input.value.annotation !== undefined
	)

	//Make sure that all declarations are input declarations
	if (inputDeclarations.length !== message.declarations.length) {
		throw new Error("Only input declarations are supported for now")
	}

	const params = Object.fromEntries(
		inputDeclarations.map((decl) => {
			return [decl.name, "NonNullable<unknown>"]
		})
	)

	const hasInputs = Boolean(inputDeclarations.length)
	const hasSelectors = Boolean(message.selectors.length)

	if (!hasSelectors) {
		const variant = message.variants[0]
		if (!variant) throw new Error(`A message must have at least one variant`)
		if (variant.match.length !== 0)
			throw new Error(`A variant on a message with no selectors must not have a match`)

		const source = inputsWithAnnotation.length
			? `export const ${bundleId} = (inputs) => {
${inputsWithAnnotation
	.map((input) => {
		return `    inputs.${input.name} = ${compileExpression(input.value)}`
	})
	.join("\n")}
    return ${compilePattern(variant.pattern)}
}`
			: `export const ${bundleId} = (${hasInputs ? "inputs" : ""}) => ${compilePattern(
					variant.pattern
			  )}`

		return {
			source,
			params,
			locale: message.locale,
		}
	}

	{
		//enforce that the variants are valid
		let hasCatchall = false
		for (const variant of message.variants) {
			if (variant.match.length !== message.selectors.length)
				throw new Error(
					`Variant has ${variant.match.length} selectors, but message has ${message.selectors.length} selectors`
				)

			hasCatchall ||= variant.match.every((match) => match === "*")
		}
		if (!hasCatchall) throw new Error("Message must have a catch-all variant")
	}

	const variants = [...message.variants].sort(compareVariants)

	const lines: string[] = [
		`export const ${bundleId} = (${hasInputs ? "inputs" : ""}) => {`,

		...inputsWithAnnotation.map((input) => {
			return `    input.${input.name} = ${compileExpression(input.value)}`
		}),

		...message.selectors.map((selector, idx) => {
			return `	const selector_${idx} = ${compileExpression(selector)}`
		}),
		"",

		...variants.map((variant) => {
			//serialize a condition
			const condition = variant.match
				.map((match, idx) => (match === "*" ? "true" : `selector_${idx} === "${match}"`))
				.join(" && ")

			return `    if(${condition}) return ${compilePattern(variant.pattern)}`
		}),
		"}",
	]

	const source = lines.join("\n")

	return {
		source,
		params,
		locale: message.locale,
	}
}

/**
 * Returns a template string for the given pattern
 * @param pattern
 */
function compilePattern(pattern: Pattern): string {
	return (
		"`" +
		pattern
			.map((el) => {
				switch (el.type) {
					case "text":
						return el.value
					case "expression": {
						return "${" + compileExpression(el) + "}"
					}
				}
			})
			.join("") +
		"`"
	)
}

function compileExpression(expression: Expression): string {
	const arg =
		expression.arg.type === "variable"
			? "inputs." + expression.arg.name
			: expression.arg.type === "literal"
			? '"' + expression.arg.value + '"'
			: "undefined" //should never match but just in case

	if (!expression.annotation) {
		return arg
	}

	// throw if options are present for now
	if (expression.annotation.options.length) throw new Error("Options are not supported yet")

	// return a call to the function
	return "registry." + expression.annotation.name + "(" + arg + ")"
}

function isInputDeclaration(declaration: Declaration): declaration is InputDeclaration {
	return declaration.type === "input"
}

function compareVariants(variantA: Variant, variantB: Variant): -1 | 0 | 1 {
	for (let i = 0; i < variantA.match.length; i++) {
		const matchA = variantA.match[i]
		const matchB = variantB.match[i]

		if (matchA === "*" && matchB !== "*") return 1
		if (matchB === "*" && matchA !== "*") return -1
	}

	return 0
}
