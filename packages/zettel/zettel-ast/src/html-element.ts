import type { ZettelTextBlock, ZettelSpan, ZettelDoc, MarkDef, BaseNode } from "./schema.js";

interface ToHtmlElementOptions {
	includeChildren?: boolean;
}

/**
 * Converts a Zettel AST node (block or span) into a DOM element.
 *
 * Useful when writing rich text editor bindings or other tools that
 * need to convert Zettel AST to HTML.
 *
 * @param node The Zettel AST node to render
 * @param options includeChildren: if true (default), recursively render and attach children
 * @returns HTMLElement representing the node
 */
export function singleNodeToHtmlElement(
	node: ZettelTextBlock | ZettelSpan | BaseNode,
	options?: ToHtmlElementOptions,
	markDefsFromParent?: MarkDef[]
): HTMLElement {
	const { includeChildren = true } = options ?? {};

	if (node._type === "zettel.textBlock") {
		const block = node as ZettelTextBlock;
		const p = document.createElement("p");
		p.setAttribute("data-zettel-key", block._key);
		if (block.markDefs && block.markDefs.length > 0) {
			// Use plain JSON.stringify, single quotes in HTML string
			p.setAttribute("data-zettel-mark-defs", JSON.stringify(block.markDefs));
		}
		if (includeChildren && block.children) {
			for (const child of block.children) {
				p.appendChild(singleNodeToHtmlElement(child, options, block.markDefs));
			}
		}
		return p;
	}
	if (node._type === "zettel.span") {
		const span = document.createElement("span");
		const zettelSpan = node as ZettelSpan;
		// Only set data-zettel-key if present in the node
		if (zettelSpan._key) {
			span.setAttribute("data-zettel-key", zettelSpan._key);
		}
		// Only set data-zettel-marks if marks are present
		if (zettelSpan.marks && zettelSpan.marks.length > 0) {
			span.setAttribute("data-zettel-marks", JSON.stringify(zettelSpan.marks));
		}
		if (includeChildren) {
			let textNode: Node = document.createTextNode(zettelSpan.text);
			if (zettelSpan.marks) {
				for (const mark of zettelSpan.marks) {
					if (mark === "zettel.strong") {
						const strong = document.createElement("strong");
						strong.appendChild(textNode);
						textNode = strong;
					} else if (mark === "zettel.em") {
						const em = document.createElement("em");
						em.appendChild(textNode);
						textNode = em;
					} else if (mark === "zettel.code") {
						const code = document.createElement("code");
						code.appendChild(textNode);
						textNode = code;
					} else if (markDefsFromParent) {
						// Handle keyed marks (e.g. links)
						const def = markDefsFromParent.find((d) => d._key === mark);
						if (def && def._type === "zettel.link" && "href" in def) {
							const a = document.createElement("a");
							a.setAttribute("href", def.href);
							a.setAttribute("data-zettel-mark-key", def._key);
							a.appendChild(textNode);
							textNode = a;
						}
					}
				}
			}
			span.appendChild(textNode);
		}
		return span;
	}
	throw new Error(`Unsupported node type: ${node}`);
}
