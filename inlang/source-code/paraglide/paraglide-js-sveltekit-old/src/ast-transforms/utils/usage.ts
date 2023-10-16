import { Node, type Identifier, SourceFile, SyntaxKind } from "ts-morph"

export const findAllIdentifiersComingFromAnImport = (sourceFile: SourceFile, path: string) => {
	const allIdentifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
	return allIdentifiers.filter((identifier) => isIdentifierComingFromAnImport(identifier, path))
}

const isIdentifierComingFromAnImport = (identifier: Identifier, path: string) => {
	const identifierName = identifier.getText()
	let currentNode: Node | undefined = identifier

	while (currentNode) {
		let nodes = [currentNode]
		if (currentNode.getParent()) {
			nodes = [...nodes, ...currentNode.getPreviousSiblings(), ...currentNode.getNextSiblings()]
		}

		const checkedNodes = nodes.map((node) =>
			checkIfImportStatementReached(node, path, identifierName),
		)
		if (checkedNodes.includes(false)) return false
		if (checkedNodes.includes(true)) return true

		currentNode = currentNode.getParent()
	}

	return false
}

const checkIfImportStatementReached = (node: Node, path: string, identifierName: string) => {
	if (shouldAbortProcessing(node, identifierName)) return false

	if (
		Node.isImportDeclaration(node) &&
		node.getModuleSpecifier().getLiteralText() === path &&
		node
			.getNamedImports()
			.some(
				(namedImport) =>
					(namedImport.getAliasNode()?.getText() || namedImport.getName()) === identifierName,
			)
	) {
		return true
	}

	return undefined
}

const shouldAbortProcessing = (node: Node, identifierName: string) => {
	if (
		Node.isVariableStatement(node) &&
		node.getDeclarations().some((declaration) => declaration.getName() === identifierName)
	) {
		return true
	}

	const parent = node.getParent()
	if (!parent) return true

	if (Node.isImportSpecifier(parent)) return true

	if (
		Node.isForOfStatement(parent) ||
		Node.isForInStatement(parent) ||
		Node.isForStatement(parent)
	) {
		const initializer = parent.getInitializer()
		if (
			Node.isVariableDeclarationList(initializer) &&
			initializer.getDeclarations().some((identifier) => identifier.getName() === identifierName)
		) {
			return true
		}
	}

	return false
}
