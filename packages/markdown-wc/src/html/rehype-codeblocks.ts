import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin that annotates fenced/indented code blocks with `data-mwc-codeblock`.
 *
 * This keeps the rendered HTML portable (`<pre><code>...</code></pre>`) while giving
 * consumers a stable hook for styling and client-side enhancements (e.g. copy buttons).
 *
 * @example
 * // Resulting HTML:
 * // <pre data-mwc-codeblock><code class="language-js">...</code></pre>
 */
export const rehypeCodeBlocks: Plugin<[], any> = () => (tree: any) => {
	visit(tree, "element", (node: any) => {
		if (!node || node.tagName !== "pre") return;
		const children = Array.isArray(node.children) ? node.children : [];
		const hasCodeChild = children.some(
			(child: any) => child?.type === "element" && child.tagName === "code"
		);
		if (!hasCodeChild) return;
		const props = (node.properties ||= {});
		if (props["data-mwc-codeblock"] != null) return;
		props["data-mwc-codeblock"] = "";
	});
};

