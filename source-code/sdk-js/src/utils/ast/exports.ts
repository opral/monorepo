import * as recast from "recast"
import type { NodePath } from "ast-types"

type ASTNode = recast.types.ASTNode
type ExportDeclaration = recast.types.namedTypes.ExportDeclaration
type ExportSpecifier = recast.types.namedTypes.ExportSpecifier

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const findExport = (ast: ASTNode, name: string) => {
	if (!recast.types.namedTypes.File.check(ast)) return // we only work on the root ast

	let exportDeclarationAst: InstanceType<(typeof NodePath<ExportDeclaration | ExportSpecifier, any>)> | undefined

	recast.visit(ast, {
		visitExportNamedDeclaration(path) {
			if (path.value.declaration) {
				const declaration = path.value.declaration.declarations[0]
				if (declaration.id.name === name) {
					exportDeclarationAst = declaration
				}
			} else {
				const specifier = path.value.specifiers[0]
				if (specifier.exported.name === name) {
					exportDeclarationAst = specifier
				}
			}

			return false
		}
	})

	return exportDeclarationAst
}
