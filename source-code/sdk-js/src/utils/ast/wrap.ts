import * as recast from "recast"
import { codeToDeclarationAst } from '../../helpers/recast.js'
import type { NodePath } from "ast-types"

const b = recast.types.builders

type ASTNode = recast.types.ASTNode
type Expression = recast.types.namedTypes.Expression
type ArrowFunctionExpression = recast.types.namedTypes.ArrowFunctionExpression
type FunctionExpression = recast.types.namedTypes.FunctionExpression
type VariableDeclarator = recast.types.namedTypes.VariableDeclarator
type Identifier = recast.types.namedTypes.Identifier

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

const WRAP_IDENTIFIER = '$$_INLANG_WRAP_$$'

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

	return b.callExpression(b.identifier(WRAP_IDENTIFIER), [expression as any])
}

// ------------------------------------------------------------------------------------------------

export const createWrapperAst = (name: string, options = '') => codeToDeclarationAst(`
	${name}(${options}).wrap(${WRAP_IDENTIFIER})`)

// ------------------------------------------------------------------------------------------------

const findWrappingPoint = (ast: ASTNode) => {
	let callExpressionAst: InstanceType<(typeof NodePath<FunctionExpression | ArrowFunctionExpression | VariableDeclarator, any>)> | undefined

	recast.visit(ast, {
		visitCallExpression: function (node) {
			if (node.value.callee.name === WRAP_IDENTIFIER) {
				this.traverse(node, {
					visitFunctionExpression: function (node) {
						callExpressionAst = node
						return false
					},
					visitArrowFunctionExpression: function (node) {
						callExpressionAst = node
						return false
					},
					visitIdentifier: function (node) {
						callExpressionAst = node
						return false
					},
				})
			}

			return false
		},

	})

	return callExpressionAst
}

const findInsertionPoint = (ast: ASTNode) => {
	let identifierAst: InstanceType<(typeof NodePath<Identifier, any>)> | undefined

	recast.visit(ast, {
		visitCallExpression: function (node) {
			if (node.value.arguments[0].name === WRAP_IDENTIFIER) {
				this.traverse(node, {
					visitIdentifier: function (node) {
						identifierAst = node
						return false
					},
				})
			}

			return false
		},
	})

	return identifierAst
}

export const mergeWrapperAst = (toWrapAst: ASTNode, wrapWithAst: ASTNode) => {
	const wrappingPointAst = findWrappingPoint(toWrapAst)
	if (!wrappingPointAst) {
		throw new Error(`Could not find wrapping point in ${toWrapAst.type}`)
	}

	const insertionPointAst = findInsertionPoint(wrapWithAst)
	if (!insertionPointAst) {
		throw new Error(`Could not find insertion point in ${toWrapAst.type}`)
	}

	insertionPointAst.replace(wrappingPointAst.value)

	return wrapWithAst
}