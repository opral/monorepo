import { parse } from "svelte/compiler"
import MagicString from "magic-string"
import {
	LANGUAGE_TAG_ALIAS,
	OUTDIR_ALIAS,
	TRANSLATE_PATH_FUNCTION_NAME,
	TRANSLATE_PATH_MODULE_ID,
} from "../constants.js"

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
		markup: ({ filename, content }: { content: string; filename: string }) => {
			//TODO bail as much as possible before parsing
			//dont' process built in Svelte files
			if (filename.includes(".sveltekit")) {
				code: content
			}

			//It's worth doing this to avoid parsing the file if it doesn't contain any links
			//`parse` is expensive
			if (!content.includes("href")) return { code: content }

			const ast = parse(content)
			const links = getLinkElements(ast)
			const s = new MagicString(content)

			injectImports(ast, s, [
				`import { languageTag as ${LANGUAGE_TAG_ALIAS} } from '${OUTDIR_ALIAS}/runtime.js';`,
				`import {${TRANSLATE_PATH_FUNCTION_NAME} } from '${TRANSLATE_PATH_MODULE_ID}';`,
			])

			//Replace all links with the new links
			for (const link of links) {
				//If the link has no href attribute there is nothing to do
				const hrefAttribute = link.attributes.find((attribute) => attribute.name === "href")
				if (!hrefAttribute) continue

				//Turn the href attribute contents into a template string
				const hrefAsTemplateString = attrubuteValuesToJSValue(hrefAttribute.value, content)

				//If the link has a hreflang attribute, use it as the language tag
				const hreflang = link.attributes.find((attribute) => attribute.name === "hreflang")
				const langValue = hreflang
					? attrubuteValuesToJSValue(hreflang.value, content)
					: `${LANGUAGE_TAG_ALIAS}()`

				//Replace the href attribute with the new href attribute
				const newHrefAttributeString = `href={${TRANSLATE_PATH_FUNCTION_NAME}(${hrefAsTemplateString}, ${langValue})}`
				s.overwrite(hrefAttribute.start, hrefAttribute.end, newHrefAttributeString)
			}

			//Generate the sourcemap
			const map = s.generateMap({
				includeContent: true,
			})

			const code = s.toString()
			return { code, map: map.toString() }
		},
	}
}

function injectImports(ast: Ast, code: MagicString, importStatements: string[]) {
	if (!ast.instance) {
		code.prepend("<script>\n" + importStatements.join("\n") + "\n</script>\n")
	} else {
		//@ts-ignore
		const scriptStart = ast.instance.content.start as number
		code.appendLeft(scriptStart, "\n" + importStatements.join("\n") + "\n")
	}
}

function getLinkElements(ast: Ast): LinkElement[] {
	let links: LinkElement[] = []
	function walk(templateNode: TemplateNode) {
		if (templateNode.type === "Element" && templateNode.name === "a") {
			links.push(templateNode as LinkElement)
		}

		templateNode.children?.forEach(walk)
	}
	walk(ast.html)
	return links
}

function attrubuteValuesToJSValue(values: AttributeValue[], originalCode: string): string {
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
