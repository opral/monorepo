import type * as AST from "@inlang/sdk/v2"

export function isInputDeclaration(
	declaration: AST.Declaration
): declaration is AST.InputDeclaration {
	return declaration.type === "input"
}

export function isExpression(pattern: AST.Pattern[number]): pattern is AST.Expression {
	return pattern.type === "expression"
}

export function isText(pattern: AST.Pattern[number]): pattern is AST.Text {
	return pattern.type === "text"
}

export function isVariableReference(
	arg: AST.Literal | AST.VariableReference
): arg is AST.VariableReference {
	return arg.type === "variable"
}

export function isLiteral(arg: AST.Literal | AST.VariableReference): arg is AST.Literal {
	return arg.type === "literal"
}
