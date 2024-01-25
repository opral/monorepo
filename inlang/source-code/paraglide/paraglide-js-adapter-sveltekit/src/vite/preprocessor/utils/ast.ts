import type { Ast, ElementNode, TemplateNode } from "../types.js"

export function getElementsFromAst<Name extends string>(
	ast: Ast,
	elementName: Name,
): ElementNode<Name>[] {
	const links: ElementNode<Name>[] = []

	function walk(templateNode: TemplateNode) {
		if (templateNode.type === "Element" && templateNode.name === elementName) {
			links.push(templateNode as ElementNode<Name>)
		}

		for (const child of templateNode.children || []) {
			walk(child)
		}

		if (templateNode.else) walk(templateNode.else)
		if (templateNode.then) walk(templateNode.then)
		if (templateNode.catch) walk(templateNode.catch)
	}

	walk(ast.html)
	return links
}
