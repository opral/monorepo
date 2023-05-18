import { types } from "recast"
import { builders } from "magicast"
import {
	NodeInfoMapEntry,
	RunOn,
	findAstJs,
	findUsedImportsInAst,
	getFunctionOrDeclarationValue,
	functionMatchers,
	arrowFunctionMatchers,
} from "./ast.js"
import type { ExpressionKind } from "ast-types/gen/kinds.js"
import type { FunctionDeclaration, Node } from "estree"
import { walk as jsWalk } from "estree-walker"

const b = types.builders
const n = types.namedTypes

export const rewriteLoadOrHandleParameters = (
	ast: types.namedTypes.FunctionExpression | types.namedTypes.ArrowFunctionExpression,
	availableImports: [string, string][] = [],
) => {
	// Find the used imports from available imports
	const usedImports = findUsedImportsInAst(ast, availableImports)
	// Extend expression parameters
	if (ast.params.length > 1)
		throw new Error(`Your load function illegally contains more than one parameter.`)
	if (usedImports.length > 0) {
		if (ast.params.length === 0) ast.params.push(b.identifier("_"))

		// Add a second parameter, if necessary
		ast.params.push(
			b.objectPattern(
				usedImports.map(([imported, local]) =>
					b.property("init", b.identifier(imported), b.identifier(local)),
				),
			),
		)
	}
}

export const extractWrappableExpression = ({
	ast,
	name,
	fallbackFunction = b.arrowFunctionExpression([], b.blockStatement([])),
	availableImports = [],
}: {
	ast: types.namedTypes.Node
	name: "load" | "handle"
	fallbackFunction?: ExpressionKind
	availableImports?: [string, string][]
}) => {
	// Get an expression that we can wrap
	const expression = getFunctionOrDeclarationValue(ast, name, fallbackFunction)
	b.functionDeclaration
	// Rewrite the load functions parameters.
	if (n.ArrowFunctionExpression.check(expression) || n.FunctionExpression.check(expression))
		rewriteLoadOrHandleParameters(expression, availableImports)
	return expression
}

export const replaceOrAddExportNamedFunction = (
	ast: types.namedTypes.Program,
	name: string,
	replacementAst: types.namedTypes.ExportNamedDeclaration,
) => {
	jsWalk(ast as Node, {
		enter(node) {
			if (
				n.ExportNamedDeclaration.check(node) &&
				((n.VariableDeclaration.check(node.declaration) &&
					n.VariableDeclarator.check(node.declaration.declarations[0]) &&
					n.Identifier.check(node.declaration.declarations[0].id) &&
					node.declaration.declarations[0].id.name === name) ||
					(n.FunctionDeclaration.check(node.declaration) &&
						n.Identifier.check(node.declaration.id)))
			) {
				this.replace(replacementAst as Node)
			}
		},
	})
}

export const getWrappedExport = (
	options: unknown,
	params: (FunctionDeclaration | ExpressionKind)[],
	exportedName: string,
	wrapperName: string,
) => {
	const initHandleWrapperCall = options
		? builders.functionCall(wrapperName, options)
		: builders.functionCall(wrapperName)
	const wrapperDeclarationAst = b.callExpression(
		b.memberExpression(initHandleWrapperCall.$ast, b.identifier("wrap")),
		params.map((parameter) =>
			n.FunctionDeclaration.check(parameter)
				? b.functionExpression.from({
						id: parameter.id,
						generator: parameter.generator,
						async: parameter.async,
						params: parameter.params,
						body: parameter.body,
				  })
				: parameter,
		) as ExpressionKind[],
	)
	return b.exportNamedDeclaration(
		b.variableDeclaration("const", [
			b.variableDeclarator(b.identifier(exportedName), wrapperDeclarationAst),
		]),
	)
}

// NOTES: Test this with imports on a single line or on multiple lines
// Removes all the @inlang/sdk-js import(s) (There could theoretically be multiple imports on multiple lines)
// Returns an array with the import properties and their aliases
export const getSdkImportedModules = (
	ast: types.namedTypes.Node | Node,
	remove = true,
): [string, string][] =>
	findAstJs(
		ast,
		[
			({ node }) =>
				n.ImportDeclaration.check(node) &&
				n.Literal.check(node.source) &&
				node.source.value === "@inlang/sdk-js",
			({ node }) => n.ImportSpecifier.check(node),
		],
		(node) =>
			n.ImportSpecifier.check(node)
				? (meta) => {
						const { parent } = meta.get(
							node,
						) as NodeInfoMapEntry<types.namedTypes.ImportDeclaration>
						// Remove the complete import from "@inlang/sdk-js"
						// (We assume that imports can only be top-level)
						if (n.Program.check(ast) && remove) {
							const declarationIndex = ast.body.findIndex((node) => node === parent)
							declarationIndex != -1 && ast.body.splice(declarationIndex, 1)
						}
						return [node.imported.name, node.local?.name ?? node.imported.name]
				  }
				: undefined,
	)[0] ?? []

export const replaceSdkImports = (ast: types.namedTypes.Node | Node, from: "locals") => {
	const importedModules = getSdkImportedModules(ast, false)
	// <id> -> getRuntimeFromLocals(event.locals).<id>
	const localsReplace = (id: string) =>
		b.memberExpression(
			b.callExpression(b.identifier("getRuntimeFromLocals"), [
				b.memberExpression(b.identifier("event"), b.identifier("locals")),
			]),
			b.identifier(id),
		)
	const replace = from === "locals" ? localsReplace : () => undefined
	jsWalk(ast as Node, {
		enter(node) {
			if (n.ImportDeclaration.check(node)) this.skip()
			else if (
				n.Identifier.check(node) &&
				importedModules.some(([, alias]) => node.name === alias)
			) {
				this.replace(replace(node.name) as Node)
				this.skip()
			}
		},
	})
}
