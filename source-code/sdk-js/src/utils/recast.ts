import { dedent } from 'ts-dedent'
import * as recast from "recast"
// TODO: use TypeScript parser if TypeScript is installed
import * as parser from "recast/parsers/esprima"
type ASTNode = recast.types.ASTNode

export const parseCode = (code: string) => recast.parse(code, { parser }) as ASTNode

export const printCode = (ast: recast.types.ASTNode) => recast.print(ast).code

// ------------------------------------------------------------------------------------------------

export const codeToAst = (code: string) => parseCode(dedent(code))

export const codeToDeclarationAst = (code: string) => {
	const ast = codeToAst(code).program.body[0]

	if (recast.types.namedTypes.ExpressionStatement.check(ast)) {
		return ast.expression
	}
	if (recast.types.namedTypes.VariableDeclaration.check(ast)) {
		return ast.declarations[0]?.init
	}

	return ast.declarations[0]
}

export const astToCode = (ast: recast.types.ASTNode) => recast.prettyPrint(ast, {
	quote: 'single',
	tabWidth: 3,
	useTabs: true,
}).code
