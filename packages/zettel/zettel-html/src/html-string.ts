import type {
	ZettelDoc,
	ZettelTextBlock,
	ZettelSpan,
	ZettelLinkMark,
	ZettelNode,
} from "@opral/zettel-ast";
import { createZettelSpan, createZettelTextBlock, generateKey } from "@opral/zettel-ast";

/**
 * Serializes a ZettelDoc into an HTML string.
 *
 * @param doc ZettelDoc to serialize
 * @returns HTML string representation of the ZettelDoc
 *
 * @example
 * const doc = [
 *   {
 *     _type: "zettel.textBlock",
 *     _key: "abc123",
 *     style: "zettel.normal",
 *     markDefs: [],
 *     children: [
 *       {
 *         _type: "zettel.span",
 *         _key: "def456",
 *         text: "Hello!",
 *         marks: []
 *       }
 *     ]
 *   }
 * ];
 * const html = toHtmlString(doc);
 * // html => '<div data-zettel-doc="true"><p data-zettel-key="abc123">...'</div>'
 */
export function toHtmlString(doc: ZettelDoc): string {
	const container = document.createElement("div");
	container.setAttribute("data-zettel-doc", "true");

	for (const block of doc.content) {
		if (block.type === "zettel_text_block") {
			const textBlock = block as ZettelTextBlock;
			if (textBlock.style === "zettel_normal") {
				const pElement = document.createElement("p");
				pElement.setAttribute("data-zettel-key", textBlock.zettel_key);
				for (const span of textBlock.children as ZettelSpan[]) {
					if (span.type !== "zettel_span") continue;
					const outerSpanElement = document.createElement("span");
					if (span.zettel_key) {
						outerSpanElement.setAttribute("data-zettel-key", span.zettel_key);
					}

					let textNode: Node = document.createTextNode(span.text);
					if (span.marks) {
						for (const mark of span.marks) {
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
							} else if (mark.type === "zettel_link" && (mark as ZettelLinkMark).href) {
								const a = document.createElement("a");
								a.setAttribute("href", (mark as ZettelLinkMark).href);
								a.appendChild(textNode);
								textNode = a;
							}
						}
					}
					outerSpanElement.appendChild(textNode);
					pElement.appendChild(outerSpanElement);
				}
				container.appendChild(pElement);
			}
		}
	}
	return container.outerHTML;
}

function parseUnknownHtml(container: HTMLElement): ZettelDoc {
	const resultingDoc: ZettelDoc = {
		type: "zettel_doc",
		content: [],
	};
	const blockElements = ["P", "DIV"];
	const topLevel = Array.from(container.children);

	function walkInline(node: Node, marks: ZettelNode[] = []): ZettelSpan[] {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? "";
			if (text.length === 0) return [];
			return [createZettelSpan({ text, marks: marks.length > 0 ? [...marks] : undefined })];
		}
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement;
			let nextMarks = [...marks];
			if (el.tagName === "EM") nextMarks.push({ type: "zettel_italic", zettel_key: generateKey() });
			if (el.tagName === "STRONG")
				nextMarks.push({ type: "zettel_strong", zettel_key: generateKey() });
			// Add more tag-to-mark mappings as needed

			let spans: ZettelSpan[] = [];
			el.childNodes.forEach((child) => {
				spans = spans.concat(walkInline(child, nextMarks));
			});
			return spans;
		}
		return [];
	}

	topLevel.forEach((el) => {
		if (!(el instanceof HTMLElement)) return;
		if (!blockElements.includes(el.tagName)) return;
		let spans: ZettelSpan[] = [];
		el.childNodes.forEach((node) => {
			spans = spans.concat(walkInline(node));
		});
		if (spans.length > 0) {
			resultingDoc.content.push(
				createZettelTextBlock({
					style: "zettel_normal",
					children: spans,
				})
			);
		}
	});
	return resultingDoc;
}

/**
 * Parses a ZettelDoc from an HTML string.
 *
 * If the HTML string contains a ZettelDoc root element (with data-zettel-doc="true"),
 * it is parsed as a ZettelDoc. Otherwise, the function attempts to parse any recognizable
 * Zettel structure from the HTML fragment.
 *
 * @param html HTML string to parse
 * @returns ZettelDoc parsed from the HTML
 *
 * @example
 * const html = '<div data-zettel-doc="true"><p data-zettel-key="abc123">Hello!</p></div>';
 * const doc = fromHtmlString(html);
 * // doc => [{ _type: "zettel.textBlock", ... }]
 */
export function fromHtmlString(html: string): ZettelDoc {
	const container = document.createElement("div");
	container.innerHTML = html;
	if (container.getAttribute("data-zettel-doc") === "true") {
		return parseZettelHtml(container);
	}
	return parseUnknownHtml(container);
}

// placeholder
function parseZettelHtml(container: HTMLElement): ZettelDoc {
	return parseUnknownHtml(container);
}
