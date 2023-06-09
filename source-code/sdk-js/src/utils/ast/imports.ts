import { NodePath, b, n, visitNode } from '../recast.js'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const removeImport = (ast: n.File, path: string, ...names: string[]) => {
	if (!n.File.check(ast)) return // we only work on the root ast

	const importDeclarationAsts = findImportDeclarations(ast, path)
	if (!importDeclarationAsts.length) return

	for (const importDeclarationAst of importDeclarationAsts) {
		if (!importDeclarationAst.value.specifiers?.length) return

		for (const name of names) {
			const importSpecifierAst = findImportSpecifier(importDeclarationAst.value, name)
			if (!importSpecifierAst) continue

			importSpecifierAst.replace()
		}

		if ( // remove import completely
			!names.length // if no names get passed
			|| !importDeclarationAst.value.specifiers.length // if no specifiers are left
		) {
			importDeclarationAst.replace()
		}
	}
}

// ------------------------------------------------------------------------------------------------

export const addImport = (ast: n.File, path: string, ...names: [string, ...string[]]) => {
	if (!n.File.check(ast)) return // we only work on the root ast
	if (names.length === 0) return // return early if no names are passed

	const importSpecifiersAst = names.map(name => b.importSpecifier(
		b.identifier(name),
		b.identifier(name)
	))

	const importDeclarationAsts = findImportDeclarations(ast, path)
		// only keep import declarations with specifiers
		.filter(importDeclarationAst => importDeclarationAst.value.specifiers?.length)

	if (!importDeclarationAsts.length) {
		// add new import declaration at the beginning of the file
		ast.program.body = [b.importDeclaration(importSpecifiersAst, b.literal(path)), ...ast.program.body]

		return
	}

	const importDeclarationAst = importDeclarationAsts[0]!
	// add new import specifiers
	importDeclarationAst.value.specifiers?.push(
		...importSpecifiersAst.filter(({ local: toAdd }) =>
			// remove duplicates
			importDeclarationAst.value.specifiers?.every(({ local: existing }) => toAdd?.name !== existing?.name)
		))
}

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const findImportDeclarations = (ast: n.File, name: string) => {
	const importDeclarationAsts: NodePath<n.ImportDeclaration>[] = []

	visitNode(ast, {
		visitImportDeclaration: function (path) {
			if (path.value.source.value === name) {
				importDeclarationAsts.push(path)
			}
			return false
		},
	})

	return importDeclarationAsts
}

const findImportSpecifier = (ast: n.ImportDeclaration, name: string) => {
	let importSpecifierAst: NodePath<n.ImportSpecifier> | undefined

	visitNode(ast, {
		visitImportSpecifier: function (path) {
			if (path.value.imported.name === name) {
				importSpecifierAst = path
			}
			return false
		},
	})

	return importSpecifierAst
}

// ------------------------------------------------------------------------------------------------

// TODO: test
export const isOptOutImportPresent = (ast: n.File) => !!findImportDeclarations(ast, '@inlang/sdk-js/no-transforms').length