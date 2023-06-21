import { parse } from 'svelte/compiler'
import type { Ast, TemplateNode } from '../../../../../node_modules/svelte/types/compiler/interfaces.js'
import { Node, type SourceFile } from 'ts-morph'
import { findExport } from './exports.js'
import MagicStringImport from "magic-string"
import type { SvelteFileParts } from '../svelte.util.js'
import { codeToSourceFile } from '../utils.js'
import { isOptOutImportPresent as isOptOutImportPresentOriginal, isSdkImportPresent as isSdkImportPresentOriginal } from './imports.js'

export const MagicString = MagicStringImport as unknown as typeof MagicStringImport.default
export type MagicStringType = InstanceType<typeof MagicStringImport.default>

export const markupToAst = (markup: string) => parse(markup)

// ------------------------------------------------------------------------------------------------

// TODO: test
const canNodeBeWrapped = (node: TemplateNode) => {
	if (node.type === 'MustacheTag' && node.expression.type === 'Identifier' && node.expression.name.startsWith('$_INLANG_')) return false
	if (node.type === 'Window') return false
	if (node.type === 'Document') return false
	if (node.type === 'Head') return false
	if (node.type === 'Body') return false
	if (node.type === 'Options') return false

	return true
}

// ------------------------------------------------------------------------------------------------

// TODO: test
const wrapNodes = (s: MagicStringImport.default, ast: Ast, start: number, end: number, wrapWith: string) => {
	// TODO: only wrap if @inlnag/sdk-js imports get used or if it's a component or a <slot />
	const nodes = ast.html.children?.slice(start, end) || []
	if (!nodes.length) return

	if (!wrapWith.includes('$$_INLANG_WRAP_$$'))
		throw new Error('Cannot wrap with a string that contains $$_INLANG_WRAP_$$')

	const [before, after] = wrapWith.split('$$_INLANG_WRAP_$$') as [string, string]
	s.appendLeft(nodes.at(0)!.start, before)
	s.appendLeft(nodes.at(-1)!.end, after)
}

// TODO: test
export const wrapMarkupChildren = (s: MagicStringImport.default, ast: Ast, wrapWith: string) => {
	const children = [...(ast.html.children?.values() || [])]
	let start = 0
	for (const [i, child] of children.entries()) {
		if (canNodeBeWrapped(child!)) {
			continue
		} else {
			wrapNodes(s, ast, start, i, wrapWith)
			start = i + 1
		}
	}

	wrapNodes(s, ast, start, children.length, wrapWith)
}

// ------------------------------------------------------------------------------------------------

// TODO: tests
const isMarkupEmpty = (ast: Ast) => !(ast.html.children || [])
	.filter(c => !(c.type === 'Comment' || (c.type === 'Text' && !c.data.trim())))
	.length

// TODO: tests
export const insertSlotIfEmptyFile = (s: MagicStringType, ast: Ast) => {
	if (isMarkupEmpty(ast)) {
		s.appendRight(ast.html.end || 0, '<slot />')
		return true
	}

	return false
}

// ------------------------------------------------------------------------------------------------

// TODO: test
export const addDataExportIfMissingAndReturnInsertionIndex = (sourceFile: SourceFile) => {
	const dataExport = findExport(sourceFile, 'data')
	if (dataExport) return dataExport.getParent().getParent()?.getChildIndex() || 0

	const statements = sourceFile.getStatements()
	// find insertion point should come right after all imports (which ideally are on the top of the script section)
	const index = Math.max(
		statements.findIndex(statement => !Node.isImportDeclaration(statement)),
		statements.length
	)

	sourceFile.insertStatements(index, `export let data`)

	return index
}

// ------------------------------------------------------------------------------------------------

// TODO: test
export const isOptOutImportPresent = ({ script, moduleScript }: SvelteFileParts) => {
	const scriptSourceFile = codeToSourceFile(script)
	if (isOptOutImportPresentOriginal(scriptSourceFile)) return true

	const moduleScriptSourceFile = codeToSourceFile(moduleScript)
	if (isOptOutImportPresentOriginal(moduleScriptSourceFile)) return true

	return false
}

// TODO: test
export const isSdkImportPresent = ({ script, moduleScript }: SvelteFileParts) => {
	const scriptSourceFile = codeToSourceFile(script)
	if (isSdkImportPresentOriginal(scriptSourceFile)) return true

	const moduleScriptSourceFile = codeToSourceFile(moduleScript)
	if (isSdkImportPresentOriginal(moduleScriptSourceFile)) return true

	return false
}