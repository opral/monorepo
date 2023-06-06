import * as recast from "recast"
import type { NodePath } from "ast-types"

const b = recast.types.builders

type ASTNode = recast.types.ASTNode
type ImportDeclaration = recast.types.namedTypes.ImportDeclaration
type ImportSpecifier = recast.types.namedTypes.ImportSpecifier

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const removeImport = (ast: ASTNode, path: string, ...names: string[]) => {
	if (!recast.types.namedTypes.File.check(ast)) return // we only work on the root ast

	const importDeclarationAsts = findImportDeclarations(ast, path)
	if (!importDeclarationAsts.length) return

	for (const importDeclarationAst of importDeclarationAsts) {
		if (!importDeclarationAst.value.specifiers.length) return

		for (const name of names) {
			const importSpecifierAst = findImportSpecifier(importDeclarationAst.value, name)
			if (!importSpecifierAst) continue

			importSpecifierAst.replace()
		}

		if ( // remove all imports
			!names.length // if no names get passed
			|| !importDeclarationAst.value.specifiers.length // if no specifiers are left
		) {
			importDeclarationAst.replace()
		}
	}
}

// ------------------------------------------------------------------------------------------------

export const addImport = (ast: ASTNode, path: string, ...names: [string, ...string[]]) => {
	if (!recast.types.namedTypes.File.check(ast)) return // we only work on the root ast
	if (names.length === 0) return // return early if no names are passed

	const importSpecifiersAst = names.map(name => b.importSpecifier(
		b.identifier(name),
		b.identifier(name)
	))

	const importDeclarationAsts = findImportDeclarations(ast, path)
		// only keep import declarations with specifiers
		.filter(importDeclarationAst => importDeclarationAst.value.specifiers.length)

	if (!importDeclarationAsts.length) {
		// add new import declaration at the beginning of the file
		ast.program.body = [b.importDeclaration(importSpecifiersAst, b.literal(path)), ...ast.program.body]

		return
	}

	const importDeclarationAst = importDeclarationAsts[0]!
	// add new import specifiers
	importDeclarationAst.value.specifiers.push(
		...importSpecifiersAst.filter(({ local: toAdd }) =>
			// remove duplicates
			importDeclarationAst.value.specifiers
				.every(({ local: existing }: ImportSpecifier) => toAdd?.name !== existing?.name)
		))
}

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

const findImportDeclarations = (ast: ASTNode, path: string) => {
	const importDeclarationAsts: InstanceType<(typeof NodePath<ImportDeclaration, any>)>[] = []

	recast.visit(ast, {
		visitImportDeclaration: function (node) {
			if (node.value.source.value === path) {
				importDeclarationAsts.push(node)
			}
			return false
		},
	})

	return importDeclarationAsts
}

const findImportSpecifier = (ast: ASTNode, name: string) => {
	let importSpecifierAst: InstanceType<(typeof NodePath<ImportSpecifier, any>)> | undefined

	recast.visit(ast, {
		visitImportSpecifier: function (node) {
			if (node.value.imported.name === name) {
				importSpecifierAst = node
			}
			return false
		},
	})

	return importSpecifierAst
}