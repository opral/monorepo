import { codeToSourceFile } from '../utils.js'
import { Node, SyntaxKind, type SourceFile } from 'ts-morph'

// ------------------------------------------------------------------------------------------------

export const findExport = (sourceFile: SourceFile, name: string) => {
	if (!Node.isSourceFile(sourceFile)) return // we only work on the root node

	const exportVariableStatements = sourceFile.getVariableStatements()
		.filter(statement => statement.getModifiers().some(m => m.isKind(SyntaxKind.ExportKeyword)))

	for (const variableStatements of exportVariableStatements) {
		const declarations = variableStatements.getDeclarations()
		for (const declaration of declarations) {
			const nameNode = declaration.getNameNode()
			if (nameNode && nameNode.getText() === name) {
				return declaration;
			}
		}
	}

	const exportFunctionDeclarations = sourceFile.getFunctions()
		.filter(declaration => declaration.getModifiers().some(m => m.isKind(SyntaxKind.ExportKeyword)))

	for (const declaration of exportFunctionDeclarations) {
		const nameNode = declaration.getNameNode()
		if (nameNode && nameNode.getText() === name) {
			declaration.toggleModifier("export", false);
			return declaration;
		}
	}

	const exportDeclararions = sourceFile.getExportDeclarations()

	for (const declaration of exportDeclararions) {
		const namedExports = declaration.getNamedExports()
		for (const namedExport of namedExports) {
			if ((namedExport.getAliasNode() || namedExport.getNameNode()).getText())
				return namedExport;
		}
	}

	return
}

// ------------------------------------------------------------------------------------------------

export const findOrCreateExport = (sourceFile: SourceFile, name: string) => {
	const loadFnExport = findExport(sourceFile, name)
	if (loadFnExport) return loadFnExport

	const isVariableAlreadyDefined = !!sourceFile.getVariableStatements()
		.filter(statement => statement.getDeclarationList().getDeclarations()
			.some(declaration => declaration.getName() === name)
		).length
	if (isVariableAlreadyDefined)
		throw new Error(`Variable ${name} already exists`)
	// TODO: use `export { randomVariableName as load } instead of throwing an error

	const loadFnAst = codeToSourceFile(`export const ${name} = () => {}`)
	sourceFile.addVariableStatement(loadFnAst.getVariableStatement(name)!.getStructure())

	return findExport(sourceFile, name)!
}
