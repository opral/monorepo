import type { CallExpression, Node, Program } from "estree"
import type { Result } from "@inlang/core/utilities"
import { walk } from "estree-walker"
import { get } from "lodash"

export class WrapWithCallExpressionError extends Error {
	readonly #id = "WrapWithCallExpressionException"
}

type WrapVariableDeclaration = (
	sourceAst: Program,
	searchIdentifier: string,
	identifier: string,
) => Result<Program, WrapWithCallExpressionError>

const wrapWithCallExpression = (node: Node, identifier: string) => {
	return {
		type: "CallExpression",
		callee: {
			type: "Identifier",
			name: identifier,
		},
		arguments: [structuredClone(node)],
		optional: false,
	} as CallExpression
}

/**
 * Finds a variable declaration with a given name in sourceAst and wraps the corresponding declarator with the given identifier function call.
 * Is immutable towards it's inputs, meaning it DOESN'T MANIPULATE THEM.
 *
 * wrapVariableDeclaration(ast, "search", "wrap")` with an ast for the code `const search = () => {}` will result in `const search = wrap(() => {})`
 *
 * @param sourceAst The ast to operate on
 * @param searchIdentifier The name of the variable declaration whose declarator should be wrapped
 * @param identifier The function identifier with which the declarator should be wrapped.
 * @returns A promise that resolves to the resulting ast or rejects if the searched for declarator can't be found.
 */
export const wrapVariableDeclaration = ((sourceAst, searchIdentifier, identifier) => {
	const sourceAstClone = structuredClone(sourceAst)
	let found = false
	walk(sourceAstClone, {
		enter(node) {
			if (
				node.type === "VariableDeclarator" &&
				node.id.type === "Identifier" &&
				node.id.name === searchIdentifier &&
				node.init
			) {
				found = true
				const newNode = structuredClone(node)
				newNode.init = wrapWithCallExpression(node.init, identifier)
				this.replace(newNode)
				this.skip()
			}
		},
	})
	if (!found)
		return [undefined, new WrapWithCallExpressionError("Couldn't find variable declarator.")]
	return [sourceAstClone, undefined]
}) satisfies WrapVariableDeclaration

export class InsertAstError extends Error {
	readonly #id = "InsertAstException"
}

type InsertAst = (
	sourceAst: Program,
	ast: Node,
	position:
		| { after?: never; before: [string, string, ...string[]] }
		| { after: [string, string, ...string[]]; before?: never },
) => Result<Program, InsertAstError>

/**
 * Inserts the provided ast at the given position in a source ast.
 * Is immutable towards it's inputs, meaning it DOESN'T MANIPULATE THEM.
 * @param sourceAst The ESTree Program to insert into.
 * @param ast The ESTree Node to insert
 * @param position The positional information for the insert.
 * Should be an object containing a string array that is the path to the insertion point within the sourceAst.
 * Could typically begin with ["body", ...] as that is one of the first keys within an ESTree Program
 * For reference on how such a string could look, see https://lodash.com/docs/4.17.15#get
 * @param position.after An array of strings denoting the path to the insertion point within the sourceAst, before which ast shall be inserted.
 * Use array index 0 to insert into an empty Array.
 * @param position.before An array of strings denoting the path to the insertion point within the sourceAst, after which ast shall be inserted.
 * Use array index 0 to insert into an empty Array.
 * @returns Promise that either resolves to the resulting ast or throws if the given insertion position couldn't be found
 * or the positional information array length does not satisfy length % 3 === 2
 */
export const insertAst = ((sourceAst, ast, { before, after }) => {
	try {
		const sourceAstClone = structuredClone(sourceAst)
		const position = before || after
		if (position.length % 3 !== 2) {
			throw new InsertAstError("The length of 'before' or 'after' has to be a multiple of two.")
		}
		const targetParent = get(sourceAstClone, position.slice(0, -2), sourceAstClone)
		const targetArrayKey = position.at(-2)
		const targetArrayIndex = Number(position.at(-1))
		let newAst
		walk(sourceAstClone, {
			enter(node) {
				const newNode = structuredClone(node)
				if (node === targetParent) {
					const targetArray = get(newNode, targetArrayKey as string, undefined) as
						| Node[]
						| undefined
					if (!targetArray) throw new InsertAstError("Couldn't access given position in AST.")
					else targetArray.splice(targetArrayIndex + (before ? 0 : 1), 0, structuredClone(ast))
					// this.replace doesn't work on the root node - that's why we need the next line
					if (node === sourceAstClone) {
						newAst = newNode as Program
					}
					this.replace(newNode)
					this.skip()
				}
			},
		})
		return [newAst || sourceAstClone, undefined]
	} catch (error) {
		return [undefined, error as InsertAstError]
	}
}) satisfies InsertAst
