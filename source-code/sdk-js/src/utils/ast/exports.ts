import * as recast from "recast"
import { ASTNode, NodePath, codeToSourceFile, n, visitNode } from '../utils.js'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const findExport = (ast: n.File, name: string) => {
	if (!recast.types.namedTypes.File.check(ast)) {
		// we only work on the root File ast
		throw new Error(`findExport does not support '${ast || 'unknown'}'`)
	}

	let exportAst: NodePath<n.VariableDeclarator | n.FunctionDeclaration | n.ExportSpecifier> | undefined

	visitNode(ast, {
		visitExportNamedDeclaration(path: NodePath<n.ExportNamedDeclaration>) {
			visitNode(path.value, {
				visitVariableDeclarator(path: NodePath<n.VariableDeclarator>) {
					if (n.Identifier.check(path.value.id) && path.value.id.name === name) {
						exportAst = path
					}

					return false
				},
				visitFunctionDeclaration(path: NodePath<n.FunctionDeclaration>) {
					if (n.Identifier.check(path.value.id) && path.value.id.name === name) {
						exportAst = path
					}

					return false
				},
				visitExportSpecifier(path: NodePath<n.ExportSpecifier>) {
					if (path.value.exported.name === name) {
						exportAst = path
					}

					return false
				},
			})

			return false
		}
	})

	return exportAst
}

// TODO: test
export const findOrCreateExport = (ast: n.File, name: string) => {
	const loadFnExport = findExport(ast, name)
	if (loadFnExport) return loadFnExport

	// TODO: check if a local variable named `name` already exists
	const loadFnAst = codeToSourceFile(`export const ${name} = () => {}`)
	ast.program.body.push(loadFnAst.program.body[0]!)
	return findExport(ast, name)!
}


// TODO: test
export const findFunctionExpression = (ast: NodePath<n.VariableDeclarator | n.FunctionDeclaration | n.ExportSpecifier>) => {
	let functionExpressionAst: NodePath<n.ArrowFunctionExpression | n.FunctionExpression | n.FunctionDeclaration> | undefined

	visitNode(ast.value, {
		visitArrowFunctionExpression(path: NodePath<n.ArrowFunctionExpression>) {
			functionExpressionAst = path

			return false
		},
		visitFunctionExpression(path: NodePath<n.FunctionExpression>) {
			functionExpressionAst = path

			return false
		},
		visitFunctionDeclaration(path: NodePath<n.FunctionDeclaration>) {
			functionExpressionAst = path

			return false
		}
	})

	return functionExpressionAst
}