import { parse, PreprocessorGroup } from "svelte/compiler"
import { overrideRanges } from "./utils"
import MagicString from "magic-string"

type Ast = ReturnType<typeof parse>
type TemplateNode = Ast["html"]

type HrefAttribute = {
	start: number
	end: number
	value: HrefAttributeValue[]
}

type HrefAttributeValue = {
	start: number
	end: number
	type: "Text"
	raw: string
	data: string
}

/**
 *
 * @returns
 */

export function preprocess() {
	return {
		name: "paraglide-js-adapter-sveltekit",
		markup: (data: { content: string }) => {
			const ast = parse(data.content)

			let hrefAttributes: HrefAttribute[] = []
			function walk(templateNode: TemplateNode) {
				if (templateNode.type === "Element") {
					if (templateNode.name === "a") {
						const hrefAttribute = templateNode.attributes.find((attr) => attr.name === "href")
						if (hrefAttribute) {
							hrefAttributes.push({
								start: hrefAttribute.start,
								end: hrefAttribute.end,
								value: hrefAttribute.value,
							})
						}
					}
				}

				if (templateNode.children) {
					templateNode.children.forEach(walk)
				}
			}
			walk(ast.html)

			const replacements = hrefAttributes.map((hrefAttribute) => {
				const asTemplateString = valuesToTemplateString(hrefAttribute.value)
				const newAttributeString = `href={translatePath(${asTemplateString}, languageTag())}`

				return {
					start: hrefAttribute.start,
					end: hrefAttribute.end,
					value: newAttributeString,
				}
			})

			let s = new MagicString(data.content)
			overrideRanges(s, replacements)
			console.log(s.toString())

			const map = s.generateMap({
				includeContent: true,
			})

			return { code: s.toString(), map: map.toString() }
		},
	}
}

function valuesToTemplateString(values: HrefAttributeValue[]): string {
	return "`" + values.map((value) => value.data).join("") + "`"
}
