import { NodePath, codeToAst, codeToDeclarationAst, n, b, visitNode } from '../recast.js'
import { findExport, findFunctionExpression } from './exports.js'

const WRAP_IDENTIFIER = '$$_INLANG_WRAP_$$'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const wrapWithPlaceholder = (ast: NodePath<n.ArrowFunctionExpression | n.FunctionExpression | n.CallExpression | n.Identifier>) => {
	let expressionAst: NodePath<n.Expression> | undefined

	visitNode(ast.value, {
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

	ast.replace(b.callExpression(b.identifier(WRAP_IDENTIFIER), [expressionAst?.value || expressionAst]))

	return ast as NodePath<n.CallExpression>
}

// ------------------------------------------------------------------------------------------------

export const createWrapperAst = (name: string, options = '') => codeToDeclarationAst(`
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

	// toWrapAst.replace(wrapWithAst.value)
}

// ------------------------------------------------------------------------------------------------

export const wrapExportedFunction = (ast: n.File, options: string, wrapperFunctionName: string) => {
	// TODO: extract into helper function
	// start
	let loadFnExport = findExport(ast, 'load')
	if (!loadFnExport) {
		const loadFnAst = codeToAst('export const load = () => {}')
		ast.program.body.push(loadFnAst.program.body[0]!)
		loadFnExport = findExport(ast, 'load')!
	}
	// end

	// TODO: extract into helper function
	// if export is a function declaration, convert it to a function expression
	if (n.FunctionDeclaration.check(loadFnExport.value)) {
		const functionExpressionAst = b.functionExpression(loadFnExport.value.id, loadFnExport.value.params, loadFnExport.value.body)
		functionExpressionAst.async = loadFnExport.value.async
		const variableDeclarationAst = b.variableDeclaration('const', [
			b.variableDeclarator(loadFnExport.value.id!, functionExpressionAst)
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

	mergeWrapperAst(toWrapAst, wrapWithAst)

	loadFn.replace(wrapWithAst.value)
}
