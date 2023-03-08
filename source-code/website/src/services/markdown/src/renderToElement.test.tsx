import type { Config } from "@markdoc/markdoc"
import type { JSXElement } from "solid-js"
import Markdoc from "@markdoc/markdoc"
import { describe, expect, it } from "vitest"
import { renderToElement } from "./renderToElement.js"
import { renderToStringAsync } from "solid-js/web"

describe("markdownToElement()", () => {
	it("should return html when combined with renderToString", async () => {
		const ast = Markdoc.parse(mockValidMarkdown)
		const content = Markdoc.transform(ast, mockMarkdocConfig)
		const result = await renderToStringAsync(() =>
			renderToElement(content, { components: { Callout } }),
		)
		expect(result).toBeTypeOf("string")
	})
})

const mockValidMarkdown = `
---
title: Getting Started
---

# Hello from documentation

{% callout type="note" %}
Tags are composable!
{% /callout %}

`

const mockMarkdocConfig: Config = {
	tags: {
		callout: {
			attributes: {
				title: { type: "String" },
				type: {
					type: "String",
					matches: ["note", "warning"],
					errorLevel: "critical",
				},
			},
			render: "Callout",
		},
	},
}

function Callout(props: { children: JSXElement }) {
	return <div class="bg-blue-500">{props.children}</div>
}
