import { NodePath, codeToNode, n, b, visitNode } from '../recast.js'
import { findFunctionExpression, findOrCreateExport } from './exports.js'

const WRAP_IDENTIFIER = '$$_INLANG_WRAP_$$'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export function wrapWithPlaceholder(ast: NodePath<n.Identifier | n.ArrowFunctionExpression | n.FunctionExpression | n.FunctionDeclaration | n.CallExpression>): asserts ast is NodePath<n.CallExpression> {
	let expressionAst: NodePath<n.Expression> | undefined

	visitNode(ast.value, {
		visitArrowFunctionExpression(path: NodePath<n.ArrowFunctionExpression>) {
			expressionAst = path

			return false
		},
		visitFunctionExpression(path: NodePath<n.FunctionExpression>) {
			expressionAst = path

			return false
		},
		visitIdentifier(path: NodePath<n.Identifier>) {
			expressionAst = path

			return false
		},
		visitCallExpression(path: NodePath<n.CallExpression>) {
			expressionAst = path

			return false
		}
	})

	if (!expressionAst) {
		throw new Error(`wrapWithPlaceholder does not support '${ast.value?.type || 'unknown'}'`)
	} else if (n.CallExpression.check(expressionAst.value)) {
		ast.replace(expressionAst.value) // TODO test this case
	} else {
		ast.replace(b.callExpression(b.identifier(WRAP_IDENTIFIER), [expressionAst.value as n.CallExpression]))
	}
}

// ------------------------------------------------------------------------------------------------

export const createWrapperAst = (name: string, options = '') => codeToNode(`
	const x = ${name}(${options}).wrap(${WRAP_IDENTIFIER})
`) as NodePath<n.CallExpression>

// ------------------------------------------------------------------------------------------------

// TODO: test this
const findWrappingPoint = (ast: NodePath<n.CallExpression>) => {
	let callExpressionAst: NodePath<n.FunctionExpression | n.ArrowFunctionExpression | n.VariableDeclarator> | undefined

	visitNode(ast.value, {
		visitCallExpression: function (path) {
			if (path.value.callee.name === WRAP_IDENTIFIER) {
				visitNode(path.value, {
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
const findInsertionPoint = (ast: NodePath<n.CallExpression>) => {
	let identifierAst: NodePath<n.Identifier> | undefined

	visitNode(ast.value, {
		visitCallExpression: function (path) {
			if (path.value.arguments[0].name === WRAP_IDENTIFIER) {
				visitNode(path.value, {
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
export const mergeWrapperAst = (toWrapAst: NodePath<n.CallExpression>, wrapWithAst: NodePath<n.CallExpression>) => {
	const wrappingPointAst = findWrappingPoint(toWrapAst)
	if (!wrappingPointAst) {
		throw new Error(`Could not find wrapping point in ${toWrapAst.value.type}`)
	}

	const insertionPointAst = findInsertionPoint(wrapWithAst)
	if (!insertionPointAst) {
		throw new Error(`Could not find insertion point in ${toWrapAst.value.type}`)
	}

	insertionPointAst.replace(wrappingPointAst.value)
}

// ------------------------------------------------------------------------------------------------

const convertToFunctionExpression = (ast: NodePath<n.FunctionDeclaration>) => {
	const functionExpressionAst = b.functionExpression(ast.value.id, ast.value.params, ast.value.body)
	functionExpressionAst.async = ast.value.async
	const variableDeclarationAst = b.variableDeclaration('const', [
		b.variableDeclarator(ast.value.id!, functionExpressionAst)
	])
	ast.replace(variableDeclarationAst)
}

export const wrapExportedFunction = (ast: n.File, options: string | undefined, wrapperFunctionName: string, exportName: string) => {
	const fnExport = findOrCreateExport(ast, exportName)
	// if export is a function declaration, convert it to a function expression
	if (n.FunctionDeclaration.check(fnExport.value)) {
		convertToFunctionExpression(fnExport as NodePath<n.FunctionDeclaration>)
	}

	const fn = findFunctionExpression(fnExport)
	if (!fn) {
		throw Error(`Could not find ${exportName} function`)
	}

	wrapWithPlaceholder(fn)
	const wrapWithAst = createWrapperAst(wrapperFunctionName, options)

	mergeWrapperAst(fn, wrapWithAst)

	fn.replace(wrapWithAst.value)
}
