import type { Ast, ElementNode, TemplateNode } from "../types.js"

export function getElementsFromAst<Name extends string>(
	ast: Ast,
	elementName: Name
): ElementNode<Name>[] {
	const links: ElementNode<Name>[] = []

	function walk(templateNode: TemplateNode) {
		if (templateNode.type === "Element" && templateNode.name === elementName) {
			links.push(templateNode as ElementNode<Name>)
		}

		templateNode.children?.forEach(walk)
	}

	walk(ast.html)
	return links
}
