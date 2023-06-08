import * as recast from "recast"
import { astToCode, codeToAst, codeToDeclarationAst } from '../recast.js'
import type { NodePath } from "ast-types"
import { findExport, findFunctionExpression } from './exports.js'

const b = recast.types.builders
const n = recast.types.namedTypes

type ASTNode = recast.types.ASTNode
type Expression = recast.types.namedTypes.Expression
type ArrowFunctionExpression = recast.types.namedTypes.ArrowFunctionExpression
type FunctionExpression = recast.types.namedTypes.FunctionExpression
type VariableDeclarator = recast.types.namedTypes.VariableDeclarator
type Identifier = recast.types.namedTypes.Identifier

const WRAP_IDENTIFIER = '$$_INLANG_WRAP_$$'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const wrapWithPlaceholder = (ast: ASTNode) => {
	let expressionAst: InstanceType<typeof NodePath<Expression, any>> | undefined

	recast.visit(ast, {
		visitArrowFunctionExpression(path) {
			expressionAst = path

			return false
		},
		visitFunctionExpression(path) {
			expressionAst = path

			return false
		},
		visitIdentifier(path) {
			expressionAst = path

			return false
		},
	})

	if (!expressionAst) {
		throw new Error(`wrapWithPlaceholder does not support '${ast.value?.type || ast?.type || 'unknown'}'`)
	}

	return b.callExpression(b.identifier(WRAP_IDENTIFIER), [expressionAst?.value || expressionAst])
}

// ------------------------------------------------------------------------------------------------

export const createWrapperAst = (name: string, options = '') => codeToDeclarationAst(`
	${name}(${options}).wrap(${WRAP_IDENTIFIER})`)

// ------------------------------------------------------------------------------------------------

// TODO: test this
const findWrappingPoint = (ast: ASTNode) => {
	let callExpressionAst: InstanceType<(typeof NodePath<FunctionExpression | ArrowFunctionExpression | VariableDeclarator, any>)> | undefined

	recast.visit(ast, {
		visitCallExpression: function (path) {
			if (path.value.callee.name === WRAP_IDENTIFIER) {
				this.traverse(path, {
					visitFunctionExpression: function (path) {
						callExpressionAst = path
						return false
					},
					visitArrowFunctionExpression: function (path) {
						callExpressionAst = path
						return false
					},
					visitIdentifier: function (path) {
						callExpressionAst = path
						return false
					},
				})
			}

			return false
		},

	})

	return callExpressionAst
}

// TODO: test this
const findInsertionPoint = (ast: ASTNode) => {
	let identifierAst: InstanceType<(typeof NodePath<Identifier, any>)> | undefined

	recast.visit(ast, {
		visitCallExpression: function (path) {
			if (path.value.arguments[0].name === WRAP_IDENTIFIER) {
				this.traverse(path, {
					visitIdentifier: function (path) {
						identifierAst = path
						return false
					},
				})
			}

			return false
		},
	})

	return identifierAst
}

// TODO: test this
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

// ------------------------------------------------------------------------------------------------

export const wrapExportedFunction = (ast: ASTNode, options: string, wrapperFunctionName: string) => {
	let loadFnExport = findExport(ast, 'load')
	if (!loadFnExport) {
		const loadFnAst = codeToAst('export const load = () => {}')
		ast.program.body.push(loadFnAst.program.body[0])
		loadFnExport = findExport(ast, 'load')!
	}

	if (n.FunctionDeclaration.check(loadFnExport.value)) {
		const functionExpressionAst = b.functionExpression(loadFnExport.value.id, loadFnExport.value.params, loadFnExport.value.body)
		functionExpressionAst.async = loadFnExport.value.async
		const variableDeclarationAst = b.variableDeclaration('const', [
			b.variableDeclarator(loadFnExport.value.id, functionExpressionAst)
		])
		loadFnExport.replace(variableDeclarationAst)
	}

	// TODO: fix type
	const loadFn = findFunctionExpression(loadFnExport as any)
	if (!loadFn) {
		throw Error('Could not find load function')
	}

	// TODO: fix type
	const toWrapAst = wrapWithPlaceholder(loadFn as any)
	const wrapWithAst = createWrapperAst(wrapperFunctionName, options)

	loadFn.replace(mergeWrapperAst(toWrapAst, wrapWithAst))

}
