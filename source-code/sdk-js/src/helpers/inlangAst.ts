import { types } from "recast"
import { findUsedImportsInAst, getFunctionOrDeclarationValue } from "./ast.js"
import type { ExpressionKind } from "ast-types/gen/kinds.js"

const b = types.builders
const n = types.namedTypes

export const rewriteLoadOrHandleParameters = (
	ast: types.namedTypes.FunctionExpression | types.namedTypes.ArrowFunctionExpression,
	availableImports: [string, string][] = [],
) => {
	// Find the used imports from available imports
	const usedImports = findUsedImportsInAst(ast, availableImports)
	// Extend expression parameters
	if (ast.params.length > 1)
		throw new Error(`Your load function illegally contains more than one parameter.`)
	if (usedImports.length > 0) {
		if (ast.params.length === 0) ast.params.push(b.identifier("_"))

		// Add a second parameter, if necessary
		ast.params.push(
			b.objectPattern(
				usedImports.map(([imported, local]) =>
					b.property("init", b.identifier(imported), b.identifier(local)),
				),
			),
		)
	}
}

export const extractWrappableExpression = ({
	ast,
	name,
	fallbackFunction = b.arrowFunctionExpression([], b.blockStatement([])),
	availableImports = [],
}: {
	ast: types.namedTypes.Node
	name: "load" | "handle"
	fallbackFunction?: ExpressionKind
	availableImports?: [string, string][]
}) => {
	// Get an expression that we can wrap
	const expression = getFunctionOrDeclarationValue(ast, name, fallbackFunction)
	b.functionDeclaration
	// Rewrite the load functions parameters.
	if (n.ArrowFunctionExpression.check(expression) || n.FunctionExpression.check(expression))
		rewriteLoadOrHandleParameters(expression, availableImports)
	return expression
}
