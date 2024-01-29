import type { Ast, Attribute, ElementNode, TemplateNode } from "../types.js"

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

export function hasSpreadAttribute(element: ElementNode<string>): boolean {
	return element.attributes.some((attribute) => attribute.type === "Spread")
}

export function getAttributeByName<T extends string>(
	element: ElementNode<string>,
	name: T,
): Attribute<T> | undefined {
	return element.attributes.find(
		(attribute) => attribute.type === "Attribute" && attribute.name === name,
	) as Attribute<T> | undefined
}
