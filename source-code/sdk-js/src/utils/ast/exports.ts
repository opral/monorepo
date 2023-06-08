import * as recast from "recast"
import { ASTNode, NodePath, n, visitNode } from '../recast.js'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

// TODO: test output
export const findExport = (ast: n.File, name: string) => {
	if (!recast.types.namedTypes.File.check(ast)) {
		// we only work on the root File ast
		throw new Error(`findExport does not support '${ast || 'unknown'}'`)
	}

	let exportDeclarationAst: NodePath<n.ExportDeclaration | n.ExportSpecifier> | undefined

	visitNode(ast, {
		visitExportNamedDeclaration(path) {
			visitNode(path.value, {
				visitVariableDeclarator(path) {
					if (path.value.id.name === name) {
						visitNode(path.value, {
							visitArrowFunctionExpression(path) {
								exportDeclarationAst = path

								return false
							}
						})
					}

					return false
				},
				visitFunctionDeclaration(path) {
					if (path.value.id.name === name) {
						exportDeclarationAst = path
					}

					return false
				},
				visitExportSpecifier(path) {
					if (path.value.exported.name === name) {
						const local = path.value.local

						visitNode(path.value, {
							visitIdentifier(path) {
								if (path.value === local) {
									exportDeclarationAst = path
								}

								return false
							}
						})
					}

					return false
				},
			})

			return false
		}
	})

	return exportDeclarationAst
}

// TODO: test
export const findFunctionExpression = (ast: ASTNode) => {
	let functionExpressionAst: NodePath<n.ArrowFunctionExpression | n.FunctionExpression | n.FunctionDeclaration> | undefined

	visitNode(ast, {
		visitArrowFunctionExpression(path) {
			functionExpressionAst = path

			return false
		},
		visitFunctionExpression(path) {
			functionExpressionAst = path

			return false
		},
		visitFunctionDeclaration(path) {
			functionExpressionAst = path

			return false
		}
	})

	return functionExpressionAst
}