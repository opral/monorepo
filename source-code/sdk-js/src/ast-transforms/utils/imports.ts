import { type SourceFile, Node, type ImportDeclaration } from "ts-morph"

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

		if (
			// remove import completely
			!names.length || // if no names get passed
			!getNamedImportSpecifiers(importDeclaration).length // if no specifiers are left
		) {
			importDeclaration.remove()
		}
	}
}

// ------------------------------------------------------------------------------------------------

export const addImport = (
	sourceFile: SourceFile,
	path: string,
	...names: [string, ...string[]]
) => {
	if (!Node.isSourceFile(sourceFile)) return // we only work on the root node
	if (names.length === 0) return // return early if no names are passed

	const importDeclarations = findImportDeclarations(sourceFile, path)
		// only keep import declarations with specifiers
		.filter((importDeclaration) => !!getNamedImportSpecifiers(importDeclaration).length)
		.filter((importDeclaration) => !importDeclaration.isTypeOnly())

	if (!importDeclarations.length) {
		// add new import declaration at the beginning of the file
		sourceFile.insertImportDeclarations(0, [
			{
				moduleSpecifier: path,
				namedImports: names.map((name) => ({ name })),
			},
		])

		return
	}

	// add new import specifiers
	for (const name of names) {
		// check if one of the import declarations already contains the import
		if (
			importDeclarations.some((importDeclaration) =>
				findNamedImportSpecifier(importDeclaration, name),
			)
		)
			continue

		// add the import to the first import declaration
		const importDeclaration = importDeclarations[0]!
		if (!findNamedImportSpecifier(importDeclaration, name))
			importDeclaration.addNamedImports(names.map((name) => ({ name })))
	}
}

// ------------------------------------------------------------------------------------------------

const textWithoutQuotes = (text: string) => text.replace(/^['"]|['"]$/g, "")

export const findImportDeclarations = (sourceFile: SourceFile, path: string) =>
	sourceFile
		.forEachChildAsArray()
		.map((node) =>
			Node.isImportDeclaration(node) &&
			textWithoutQuotes(node.getModuleSpecifier().getText()) === path
				? node
				: undefined,
		)
		.filter(Boolean) as ImportDeclaration[]

const getNamedImportSpecifiers = (importDeclaration: ImportDeclaration) => {
	const namedImports = importDeclaration.getImportClause()?.getNamedBindings()
	if (!Node.isNamedImports(namedImports)) return []

	return namedImports.getElements()
}

export const findNamedImportSpecifier = (importDeclaration: ImportDeclaration, name: string) =>
	getNamedImportSpecifiers(importDeclaration).find(
		(element) => (element.getAliasNode()?.getText() || element.getName()) === name,
	)

// TODO: test
export const getImportSpecifiers = (importDeclaration: ImportDeclaration) =>
	getNamedImportSpecifiers(importDeclaration)

// ------------------------------------------------------------------------------------------------

export const getImportSpecifiersAsStrings = (sourceFile: SourceFile, path: string) => {
	const importDeclarations = findImportDeclarations(sourceFile, path)
	const importSpecifiers = []
	for (const importDeclaration of importDeclarations) {
		importSpecifiers.push(...getImportSpecifiers(importDeclaration))
	}

	return importSpecifiers.map((importSpecifier) => importSpecifier.getText().replace("as", ":"))
}

// ------------------------------------------------------------------------------------------------

export const isOptOutImportPresent = (sourceFile: SourceFile) =>
	!!findImportDeclarations(sourceFile, "@inlang/sdk-js/no-transforms").length

// TODO: test
export const isSdkImportPresent = (sourceFile: SourceFile) =>
	!!findImportDeclarations(sourceFile, "@inlang/sdk-js").length
