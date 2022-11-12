import Markdoc from "@markdoc/markdoc";
import type { JSXElement } from "solid-js";
import { describe, expect, it } from "vitest";
import { renderWithSolid } from "./solidPlugin.js";
import type { Config } from "@markdoc/markdoc";

describe("parseValidateAndRender()", () => {
	it("should return html", () => {
		const ast = Markdoc.parse(mockValidMarkdown);
		const content = Markdoc.transform(ast, mockMarkdocConfig);
		const result = renderWithSolid(content, { components: { Callout } });
		expect(result).toBeTypeOf("string");
	});
});

const mockValidMarkdown = `
---
title: Getting Started
---

# Hello from documentation

{% callout type="note" %}
Tags are composable!
{% /callout %}

`;

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
};

function Callout(props: { children: JSXElement }) {
	return <div class="bg-blue-500">{props.children}</div>;
}
