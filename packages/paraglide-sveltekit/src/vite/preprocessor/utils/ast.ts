import type { LegacyRoot } from "svelte/compiler"
import type { Attribute, ElementNode, TemplateNode } from "../types.js"

export function getElementsFromAst<Name extends string>(
	ast: LegacyRoot,
	elementName: Name
): ElementNode<Name>[] {
	const links: ElementNode<Name>[] = []

	function walk(templateNode: TemplateNode) {
		if (
			templateNode.type === "Element" &&
			"name" in templateNode &&
			templateNode.name === elementName
		) {
			links.push(templateNode as ElementNode<Name>)
		}

		for (const child of "children" in templateNode ? templateNode.children : []) {
			walk(child)
		}

		// @ts-ignore
		if (templateNode.else) walk(templateNode.else)
		// @ts-ignore
		if (templateNode.then) walk(templateNode.then)
		// @ts-ignore
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
	name: T
): Attribute<T> | undefined {
	return element.attributes.find(
		(attribute) => attribute.type === "Attribute" && attribute.name === name
	) as Attribute<T> | undefined
}
