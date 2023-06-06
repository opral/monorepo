import * as recast from "recast"

const b = recast.types.builders

type ASTNode = recast.types.ASTNode
type Expression = recast.types.namedTypes.Expression

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const wrapWithPlaceholder = (ast: ASTNode) => {
	let expression: Expression | undefined
	if (recast.types.namedTypes.ArrowFunctionExpression.check(ast)) {
		expression = ast
	} else if (recast.types.namedTypes.FunctionDeclaration.check(ast)) {
		expression = ast
	} else if (recast.types.namedTypes.VariableDeclarator.check(ast)) {
		expression = ast.init!
	}

	if (!expression) {
		throw new Error(`wrapWithPlaceholder does not support '${ast?.type || 'unknown'}'`)
	}

	return b.callExpression(b.identifier('$$_INLANG_WRAP_$$'), [expression as any])
}
