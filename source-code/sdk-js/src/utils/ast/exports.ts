import * as recast from "recast"
import type { NodePath, namedTypes } from "ast-types"

type ASTNode = recast.types.ASTNode
type ExportDeclaration = namedTypes.ExportDeclaration
type ExportSpecifier = namedTypes.ExportSpecifier
type ArrowFunctionExpression = namedTypes.ArrowFunctionExpression
type FunctionExpression = namedTypes.FunctionExpression
type FunctionDeclaration = namedTypes.FunctionDeclaration

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

// TODO: test output
export const findExport = (ast: InstanceType<(typeof NodePath<ASTNode>)>, name: string) => {
	if (!recast.types.namedTypes.File.check(ast)) return // we only work on the root ast

	let exportDeclarationAst: InstanceType<(typeof NodePath<ExportDeclaration | ExportSpecifier, any>)> | undefined

	recast.visit(ast, {
		visitExportNamedDeclaration(path) {
			this.traverse(path, {
				visitVariableDeclarator(path) {
					if (path.value.id.name === name) {
						exportDeclarationAst = path
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
						exportDeclarationAst = path
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
	let functionExpressionAst: InstanceType<(typeof NodePath<ArrowFunctionExpression | FunctionExpression | FunctionDeclaration, any>)> | undefined

	recast.visit(ast, {
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