import { parse } from "svelte/compiler"
import MagicString from "magic-string"

type Ast = ReturnType<typeof parse>
type TemplateNode = Ast["html"]

type LinkElement = {
	start: number
	end: number
	attributes: Attribute[]
	name: string
}

type Attribute = {
	start: number
	end: number
	name: string
	value: AttributeValue[]
}

type AttributeValue =
	| {
			start: number
			end: number
			type: "Text"
			raw: string
			data: string
	  }
	| {
			start: number
			end: number
			type: "MustacheTag"
			expression: {
				start: number
				end: number
			}
	  }

export function preprocess() {
	return {
		name: "@inlang/paraglide-js-adapter-sveltekit",
		markup: (data: { content: string }) => {
			const ast = parse(data.content)

			let links: LinkElement[] = []
			function walk(templateNode: TemplateNode) {
				console.log(templateNode)
				if (templateNode.type === "Element" && templateNode.name === "a") {
					links.push(templateNode as LinkElement)
				}

				templateNode.children?.forEach(walk)
			}
			walk(ast.html)

			const s = new MagicString(data.content)
			for (const link of links) {
				const hrefAttribute = link.attributes.find((attribute) => attribute.name === "href")
				if (!hrefAttribute) continue
				const hreflang = link.attributes.find((attribute) => attribute.name === "hreflang")

				const hrefAsTemplateString = attrubuteValuesToTemplateString(
					hrefAttribute.value,
					data.content
				)
				const langValue = hreflang
					? attrubuteValuesToTemplateString(hreflang.value, data.content)
					: "languageTag()"

				const newHrefAttributeString = `href={translatePath(${hrefAsTemplateString}, ${langValue})}`
				s.overwrite(hrefAttribute.start, hrefAttribute.end, newHrefAttributeString)
			}

			const map = s.generateMap({
				includeContent: true,
			})

			return { code: s.toString(), map: map.toString() }
		},
	}
}

function attrubuteValuesToTemplateString(values: AttributeValue[], originalCode: string): string {
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
	return string.replace(/`/g, "\\`")
}