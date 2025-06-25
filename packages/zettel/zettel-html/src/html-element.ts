import type { ZettelTextBlock, ZettelSpan } from "@opral/zettel-ast";

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
	node: ZettelTextBlock | ZettelSpan,
	options?: ToHtmlElementOptions,
	markDefsFromParent?: any[]
): HTMLElement {
	const { includeChildren = true } = options ?? {};

	if (node.type === "zettel_text_block") {
		const block = node as ZettelTextBlock;
		const p = document.createElement("p");
		p.setAttribute("data-zettel-key", block.zettel_key);

		if (includeChildren && block.children) {
			for (const child of block.children) {
				p.appendChild(singleNodeToHtmlElement(child, options, block.markDefs));
			}
		}
		return p;
	}
	if (node.type === "zettel_span") {
		const span = document.createElement("span");
		const zettelSpan = node as ZettelSpan;
		if (zettelSpan.zettel_key) {
			span.setAttribute("data-zettel-key", zettelSpan.zettel_key);
		}

		if (includeChildren) {
			let textNode: Node = document.createTextNode(zettelSpan.text);
			if (zettelSpan.marks) {
				for (const mark of zettelSpan.marks) {
					if (mark.type === "zettel_bold") {
						const strong = document.createElement("strong");
						strong.appendChild(textNode);
						textNode = strong;
					} else if (mark.type === "zettel_italic") {
						const em = document.createElement("em");
						em.appendChild(textNode);
						textNode = em;
					} else if (mark.type === "zettel_code") {
						const code = document.createElement("code");
						code.appendChild(textNode);
						textNode = code;
					} else if (mark.type === "zettel_link" && typeof (mark as any).href === "string") {
						// Only link marks have href
						const a = document.createElement("a");
						a.setAttribute("href", (mark as any).href);
						a.appendChild(textNode);
						textNode = a;
					}
				}
			}
			span.appendChild(textNode);
		}
		return span;
	}
	throw new Error(`Unsupported node type: ${node}`);
}
