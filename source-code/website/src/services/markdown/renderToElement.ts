/**
 * -------------------------------------
 * This code is a plugin for markdoc that renders solid components.
 *
 * Read more about https://markdoc.dev/
 * -------------------------------------
 */

import type { RenderableTreeNodes, Scalar } from "@markdoc/markdoc";
import type { Component, JSXElement } from "solid-js";
import { createComponent } from "solid-js";
import { Dynamic } from "solid-js/web";

/**
 * Renders a tree node to a solid element.
 *
 * Can be combined with Solids `renderToStringAsync` function
 * to render the element to static html. Important: The `renderToElement`
 * function must be called within the closure of `renderToStringAsync`.
 * Otherwise, Solid can't render the Suspense component(s).
 *
 * @example
 * 	const html = await renderToStringAsync(() => renderToElement(args));
 */
export function renderToElement(
	node: RenderableTreeNodes,
	args: {
		components?: Record<string, Component<any>>;
	}
): JSXElement {
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
	return render(node);
}

function Fragment(props: { children: JSXElement }) {
	return props.children;
}
