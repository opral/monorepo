import { NodePath, codeToSourceFile, n, visitNode } from '../utils.js'
import { Node, SyntaxKind, type SourceFile } from 'ts-morph'

// ------------------------------------------------------------------------------------------------
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

	return undefined
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