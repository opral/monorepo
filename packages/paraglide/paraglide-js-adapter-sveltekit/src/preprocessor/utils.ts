import type { Ast, AttributeValue, ElementNode, TemplateNode } from "./types.js"

export function attrubuteValuesToJSValue(values: AttributeValue[], originalCode: string): string {
	let templateString = "`"

	for (const value of values) {
		switch (value.type) {
			case "Text":
				templateString += escapeStringLiteral(value.data)
				break
			case "MustacheTag": {
				const expressionCode = originalCode.slice(value.expression.start, value.expression.end)
				templateString += "${"
				templateString += expressionCode
				templateString += "}"
				break
			}
		}
	}

	templateString += "`"
	return templateString
}

function escapeStringLiteral(string: string) {
	return string.replace(/`/g, "\\`").replace(/\$/g, "\\$")
}

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
