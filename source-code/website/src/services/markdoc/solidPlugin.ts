import type { RenderableTreeNodes, Scalar } from "@markdoc/markdoc";
import type { Component, JSXElement } from "solid-js";
import { createComponent } from "solid-js";
import { Dynamic } from "solid-js/web";

export function renderWithSolid(
	node: RenderableTreeNodes,
	args: {
		components?: Record<string, Component<{ children: JSXElement }>>;
	}
) {
	// buggy render returns an object with t. no clue why that happens.
	// the code has been taken rom the markdoc source code
	return buggyRender(node, args).t;
}

function buggyRender(
	node: RenderableTreeNodes,
	args: {
		components?: Record<string, Component<{ children: JSXElement }>>;
	}
): { t: string } {
	function deepRender(value: any): any {
		if (value == null || typeof value !== "object") return value;

		if (Array.isArray(value)) {
			return value.map((item) => deepRender(item));
		}

		if (value.$$mdType === "Tag") {
			return render(value);
		}

		if (typeof value !== "object") {
			return value;
		}

		const output: Record<string, Scalar> = {};
		for (const [k, v] of Object.entries(value)) output[k] = deepRender(v);
		return output;
	}

	function render(node: RenderableTreeNodes): JSXElement | null {
		if (Array.isArray(node)) {
			return createComponent(Fragment, { children: node.map(render) });
		}

		if (node === null || typeof node !== "object") {
			return node;
		}

		const { name, attributes = {}, children = [] } = node;

		const attr =
			Object.keys(attributes).length === 0 ? null : deepRender(attributes);

		if (args.components?.[name]) {
			return createComponent(args.components[name], {
				...attr,
				children: children.map(render),
			});
		}

		return Dynamic({
			component: name,
			children: children.map(render),
			...attr,
		});
	}
	return render(node) as unknown as { t: string };
}

function Fragment(props: { children: JSXElement }) {
	return props.children;
}
