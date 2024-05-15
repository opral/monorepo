import type * as AST from "@inlang/sdk/v2"
import type { Registry } from "./registry/registry.js"

/**
 * Analyzes a message & returns the type constraints for each input
 */
export function getInputTypeConstraints(
	message: AST.Message,
	registry: Registry
): Record<string, Set<string>> {
	// collect all expressions in the message
	const expressions = new Set<AST.Expression>([
		...message.declarations.map((decl) => decl.value),
		...message.selectors,
		...message.variants.flatMap((variant) =>
			variant.pattern.filter((el): el is AST.Expression => el.type === "expression")
		),
	])

	// initialite type constraint map with all inputs
	const inputTypes = Object.fromEntries(
		message.declarations
			.filter((decl) => decl.type === "input")
			.map((decl) => [decl.name, new Set<string>()])
	)

	// loop over all expressions & collect type constraints
	for (const expression of expressions) {
		// if there is no function annotation there is no type constraint
		if (!expression.annotation || expression.annotation.type !== "function") continue

		// get type-contraints for inputs that are used as options
		for (const options of expression.annotation.options) {
			if (options.value.type !== "variable") continue

			// If the variable is an input -> add type-contraint
			const typeConstraints = inputTypes[options.value.name]
			const typeConstraint = registry[expression.annotation.name]?.signature.options[options.name]

			if (typeConstraints && typeConstraint) {
				typeConstraints.add(typeConstraint)
			}
		}

		// get type-contraints for inputs that are used as arguments
		if (expression.arg.type === "variable") {
			// If the variable is an input -> add type-contraint
			const typeConstraints = inputTypes[expression.arg.name]
			const typeConstraint = registry[expression.annotation.name]?.signature.input
			if (typeConstraints && typeConstraint) typeConstraints.add(typeConstraint)
		}
	}

	return inputTypes
}
