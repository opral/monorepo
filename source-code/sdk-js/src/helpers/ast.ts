import type { CallExpression, Node, Program } from "estree"
import { walk } from "estree-walker"

type wrapVariableDeclaration = (
	sourceAst: Program,
	searchIdentifier: string,
	identifier: string,
) => Program

type insertAst = (
	sourceAst: Program,
	ast: Program,
	position: { before: string; after?: never } | { before?: never; after: string },
) => Program

export const wrapVariableDeclaration = ((sourceAst, searchIdentifier, identifier) => {
	const wrap = (n: Node, identifier: string) => {
		return {
			type: "CallExpression",
			callee: {
				type: "Identifier",
				name: identifier,
			},
			arguments: [structuredClone(n)],
			optional: false,
		} as CallExpression
	}
	walk(sourceAst, {
		enter(node) {
			if (
				node.type === "VariableDeclarator" &&
				node.id.type === "Identifier" &&
				node.id.name === searchIdentifier &&
				node.init
			) {
				const newNode = structuredClone(node)
				newNode.init = wrap(node.init, identifier)
				this.replace(newNode)
			}
		},
	})
	return sourceAst
}) satisfies wrapVariableDeclaration

export const insertAst = ((sourceAst, ast, position) => {
	return sourceAst
}) satisfies insertAst
