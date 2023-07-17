import {
	Node,
	type CallExpression,
	SyntaxKind,
	SourceFile,
	VariableDeclaration,
	FunctionDeclaration,
	ExportSpecifier,
} from "ts-morph"
import { codeToNode, nodeToCode } from "./js.util.js"
import { findOrCreateExport } from "./exports.js"
import { InlangException } from "../../exceptions.js"
import { InlangSdkException } from "../../adapter-sveltekit/vite-plugin/exceptions.js"
import { dedent } from "ts-dedent"

const WRAP_IDENTIFIER = "$$_INLANG_WRAP_$$"

// ------------------------------------------------------------------------------------------------

export function wrapWithPlaceholder(node: Node): CallExpression {
	if (
		Node.isArrowFunction(node) ||
		Node.isFunctionExpression(node) ||
		Node.isIdentifier(node) ||
		Node.isCallExpression(node) ||
		Node.isSatisfiesExpression(node)
	) {
		return node.replaceWithText(`$$_INLANG_WRAP_$$(${nodeToCode(node)})`) as CallExpression
	}

	throw new InlangSdkException(
		`Wrapping placeholder does not support node of kind '${node.getKindName()}'.`,
	)
}

// ------------------------------------------------------------------------------------------------

export const createWrapperAst = (name: string, options = "") =>
	codeToNode(`
	const x = ${name}(${options}).use(${WRAP_IDENTIFIER})
`) as CallExpression

// ------------------------------------------------------------------------------------------------

const findWrappingPoint = (callExpression: CallExpression) => {
	if (!callExpression.getExpression().getText()) {
		throw new InlangSdkException(dedent`
			Could not find CallExpression in code:

			${callExpression.getText()}

		`)
	}

	const argument = callExpression.getArguments()[0]
	if (!argument) {
		throw new InlangSdkException(dedent`
			Could not find Argument in code:

			${callExpression.getText()}

		`)
	}

	return argument
}

const findInsertionPoint = (callExpression: CallExpression) => {
	const insertionPoint = callExpression
		.getDescendantsOfKind(SyntaxKind.Identifier)
		.find((identifier) => identifier.getText() === WRAP_IDENTIFIER)

	if (!insertionPoint) {
		throw new InlangSdkException(dedent`
			Could not find insertion point in code:

			${callExpression.getText()}

		`)
	}

	return insertionPoint
}

export const mergeWrapperAst = (toWrapAst: CallExpression, wrapWithAst: CallExpression) => {
	const wrappingPoint = findWrappingPoint(toWrapAst)
	const insertionPoint = findInsertionPoint(wrapWithAst)

	insertionPoint.replaceWithText(nodeToCode(wrappingPoint))
}

// ------------------------------------------------------------------------------------------------

const findFunctionExpression = (
	node: VariableDeclaration | FunctionDeclaration | ExportSpecifier,
) => {
	if (Node.isVariableDeclaration(node)) {
		return node.getInitializer()!
	}

	if (Node.isFunctionDeclaration(node)) {
		return node
	}

	throw new InlangSdkException(dedent`
		Could not find function expression in code:

		${node.getText()}

	`)
}

export const wrapExportedFunction = (
	sourceFile: SourceFile,
	options: string | undefined,
	wrapperFunctionName: string,
	exportName: string,
	defaultImplementation?: string | undefined,
) => {
	const fnExport = findOrCreateExport(sourceFile, exportName, defaultImplementation)

	// if export is a function declaration, convert it to a function expression
	if (Node.isFunctionDeclaration(fnExport)) {
		fnExport.replaceWithText(`export const ${exportName} = ${nodeToCode(fnExport)}`)
		wrapExportedFunction(sourceFile, options, wrapperFunctionName, exportName)
		return
	}

	const fn = findFunctionExpression(fnExport)
	if (!fn) {
		throw new InlangSdkException(`Could not find exported function '${exportName}'`)
	}

	const wrapped = wrapWithPlaceholder(fn)
	const wrapWithAst = createWrapperAst(wrapperFunctionName, options)

	mergeWrapperAst(wrapped, wrapWithAst)
	wrapped.replaceWithText(nodeToCode(wrapWithAst))
}
