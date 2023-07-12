import type { Ast, TemplateNode } from './../../../../node_modules/svelte/types/compiler/interfaces.js'
import type { MagicStringType } from '../../magic-string.js'

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
const wrapNodes = (s: MagicStringType, ast: Ast, start: number, end: number, wrapWith: string) => {
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
export const wrapMarkupChildren = (s: MagicStringType, ast: Ast, wrapWith: string) => {
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
