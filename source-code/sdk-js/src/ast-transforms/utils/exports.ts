import { dedent } from "ts-dedent"
import { InlangSdkException } from "../../adapter-sveltekit/vite-plugin/exceptions.js"
import { codeToSourceFile } from "./js.util.js"
import { Node, SyntaxKind, type SourceFile } from "ts-morph"

// ------------------------------------------------------------------------------------------------

export const findExport = (sourceFile: SourceFile, name: string) => {
	if (!Node.isSourceFile(sourceFile)) return // we only work on the root node

	const exportVariableStatements = sourceFile
		.getVariableStatements()
		.filter((statement) => statement.getModifiers().some((m) => m.isKind(SyntaxKind.ExportKeyword)))

	for (const variableStatements of exportVariableStatements) {
		const declarations = variableStatements.getDeclarations()
		for (const declaration of declarations) {
			const nameNode = declaration.getNameNode()
			if (nameNode && nameNode.getText() === name) {
				return declaration
			}
		}
	}

	const exportFunctionDeclarations = sourceFile
		.getFunctions()
		.filter((declaration) =>
			declaration.getModifiers().some((m) => m.isKind(SyntaxKind.ExportKeyword)),
		)

	for (const declaration of exportFunctionDeclarations) {
		const nameNode = declaration.getNameNode()
		if (nameNode && nameNode.getText() === name) {
			declaration.toggleModifier("export", false)
			return declaration
		}
	}

	const exportDeclararions = sourceFile.getExportDeclarations()

	for (const declaration of exportDeclararions) {
		const namedExports = declaration.getNamedExports()
		for (const namedExport of namedExports) {
			if ((namedExport.getAliasNode() || namedExport.getNameNode()).getText()) return namedExport
		}
	}

	return
}

// ------------------------------------------------------------------------------------------------

export const findOrCreateExport = (
	sourceFile: SourceFile,
	name: string,
	defaultImplementation = "() => { }",
) => {
	const fnExport = findExport(sourceFile, name)
	if (fnExport) return fnExport

	const isVariableAlreadyDefined = !!sourceFile.getVariableStatements().filter((statement) =>
		statement
			.getDeclarationList()
			.getDeclarations()
			.some((declaration) => declaration.getName() === name),
	).length
	if (isVariableAlreadyDefined)
		throw new InlangSdkException(dedent`
			Variable '${name}' already exists. The inlang SDK needs to export a variable with this name.
			Please rename the variable in this file.
		`)
	// TODO: use `export { randomVariableName as load } instead of throwing an error

	const createdFn = codeToSourceFile(`export const ${name} = ${defaultImplementation}`)
	sourceFile.addVariableStatement(createdFn.getVariableStatement(name)!.getStructure())

	return findExport(sourceFile, name)!
}
