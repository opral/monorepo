import { dedent } from 'ts-dedent'
import * as recast from "recast"
import type { NodePath as NodePathOriginal } from "ast-types/lib/node-path"
import type { ASTNode } from "ast-types/lib/types"
import { namedTypes as n } from "ast-types"

// TODO: use TypeScript parser if TypeScript is installed
import * as parser from "recast/parsers/esprima"

// ------------------------------------------------------------------------------------------------

type NodePath<V = any> = NodePathOriginal<any, V>

export type {
	ASTNode,
	NodePath,
}

export const b = recast.types.builders

export { n }

// ------------------------------------------------------------------------------------------------

const parseCode = (code: string) => recast.parse(code, { parser }) as n.File

const printCode = (ast: ASTNode | NodePath) => recast.prettyPrint(
	n.Node.check(ast) ? ast : (ast as NodePath).value,
	{
		quote: 'single',
		tabWidth: 3,
		useTabs: true,
	}
).code

// ------------------------------------------------------------------------------------------------

export const visitNode = recast.visit

export const codeToAst = (code: string) => parseCode(dedent(code))

export const codeToDeclarationAst = (code: string) => {
	const ast = codeToAst(code).program.body[0]!

	let foundDeclarationAst: NodePath<n.ArrowFunctionExpression | n.FunctionExpression | n.CallExpression | n.Identifier> | undefined

	visitNode(ast, {
		visitVariableDeclarator(path) {
			if (path.value.id.name !== 'x') {
				throw new Error('you must name the variable "x"')
			}

			visitNode(path.value, {
				visitArrowFunctionExpression(path: NodePath<n.ArrowFunctionExpression>) {
					foundDeclarationAst = path
					return false
				},
				visitFunctionExpression(path: NodePath<n.FunctionExpression>) {
					foundDeclarationAst = path
					return false
				},
				visitCallExpression(path: NodePath<n.CallExpression>) {
					foundDeclarationAst = path
					return false
				},
				visitIdentifier(path: NodePath<n.Identifier>) {
					foundDeclarationAst = path
					return false
				},
			})

			return false
		}
	})

	if (!foundDeclarationAst) {
		throw new Error('codeToDeclarationAst: could not find declaration')
	}

	return foundDeclarationAst
}

export const astToCode = (ast: ASTNode | NodePath) => printCode(ast)
