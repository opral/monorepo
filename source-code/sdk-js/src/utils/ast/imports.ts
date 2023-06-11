import { type SourceFile, Node, type ImportDeclaration } from 'ts-morph'

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

export const removeImport = (sourceFile: SourceFile, path: string, ...names: string[]) => {
	if (!Node.isSourceFile(sourceFile)) return // we only work on the root node

	const importDeclarations = findImportDeclarations(sourceFile, path)
	if (!importDeclarations.length) return

	for (const importDeclaration of importDeclarations) {
		if (!importDeclaration.getImportClause()?.getNamedBindings()) return

		for (const name of names) {
			const importSpecifier = findNamedImportSpecifier(importDeclaration, name)
			if (!importSpecifier) continue

			importSpecifier.remove()
		}

		if ( // remove import completely
			!names.length // if no names get passed
			|| !getNamedImportSpecifiers(importDeclaration).length // if no specifiers are left
		) {
			importDeclaration.remove()
		}
	}
}

// ------------------------------------------------------------------------------------------------

export const addImport = (sourceFile: SourceFile, path: string, ...names: [string, ...string[]]) => {
	if (!Node.isSourceFile(sourceFile)) return // we only work on the root node
	if (names.length === 0) return // return early if no names are passed

	const importDeclarations = findImportDeclarations(sourceFile, path)
		// only keep import declarations with specifiers
		.filter(importDeclaration => !!getNamedImportSpecifiers(importDeclaration).length)

	if (!importDeclarations.length) {
		// add new import declaration at the beginning of the file
		sourceFile.insertImportDeclarations(0, [{
			moduleSpecifier: path,
			namedImports: names.map(name => ({ name })),
		}])

		return
	}

	// TODO: we must check first if one of the import declarations already contains a named import
	const importDeclaration = importDeclarations[0]!
	// add new import specifiers
	for (const name of names) {
		if (!findNamedImportSpecifier(importDeclaration, name))
			importDeclaration.addNamedImports(names.map(name => ({ name })))
	}
}

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

const textWithoutQuotes = (text: string) => text.replace(/^['"]|['"]$/g, '')

// TODO: test
export const findImportDeclarations = (sourceFile: SourceFile, name: string) =>
	sourceFile.forEachChildAsArray()
		.map((node) => Node.isImportDeclaration(node)
			&& textWithoutQuotes(node.getModuleSpecifier().getText()) === name
			? node
			: undefined
		).filter(Boolean) as ImportDeclaration[]

// TODO: test
const getNamedImportSpecifiers = (importDeclaration: ImportDeclaration) => {
	const namedImports = importDeclaration.getImportClause()?.getNamedBindings()
	if (!Node.isNamedImports(namedImports)) return []

	return namedImports.getElements()
}

// TODO: test
const findNamedImportSpecifier = (importDeclaration: ImportDeclaration, name: string) =>
	getNamedImportSpecifiers(importDeclaration).find((element) =>
		(element.getAliasNode()?.getText() || element.getName()) === name
	)

// ------------------------------------------------------------------------------------------------

// TODO: test
export const isOptOutImportPresent = (sourceFile: SourceFile) => !!findImportDeclarations(sourceFile, '@inlang/sdk-js/no-transforms').length