import type {
	ZettelDoc,
	ZettelTextBlock,
	ZettelSpan,
	MarkDef,
	ZettelLinkMarkDef,
} from "./schema.js";
import { createZettelSpan, createZettelTextBlock } from "./builder.js"; // Assuming builder generates keys

export function toHtml(doc: ZettelDoc): string {
	const container = document.createElement("div"); // Temporary container
	container.setAttribute("data-zettel-doc", "true"); // Set attribute value to 'true'

	for (const block of doc) {
		if (block._type === "zettel.textBlock") {
			const textBlock = block as ZettelTextBlock;
			if (textBlock.style === "zettel.normal") {
				const pElement = document.createElement("p");
				if (textBlock._key) {
					pElement.setAttribute("data-zettel-key", textBlock._key);
				}

				// Serialize markDefs if they exist
				if (textBlock.markDefs && textBlock.markDefs.length > 0) {
					try {
						pElement.setAttribute("data-zettel-mark-defs", JSON.stringify(textBlock.markDefs));
					} catch (e) {
						console.error("Failed to serialize markDefs:", e);
						// Handle error appropriately, maybe skip the attribute
					}
				}

				// Create a lookup map for mark definitions for easier access
				const markDefMap = new Map<string, MarkDef>(
					textBlock.markDefs?.map((def) => [def._key, def]) ?? []
				);

				// Use for...of loop
				for (const span of textBlock.children as ZettelSpan[]) {
					if (span._type !== "zettel.span") {
						continue; // Skip if not a span
					}

					// 1. Create the outer span element
					const outerSpanElement = document.createElement("span");
					if (span._key) {
						outerSpanElement.setAttribute("data-zettel-key", span._key);
					}

					// 2. Determine the innermost element (starts as the outer span)
					let innermostElement: HTMLElement = outerSpanElement;

					if (span.marks && span.marks.length > 0) {
						// Iterate over marks in their original order
						for (const mark of span.marks) {
							let wrapperElement: HTMLElement | null = null;
							const markDef = markDefMap.get(mark); // Check if mark is a key

							// Handle standard simple marks
							if (mark === "zettel.strong") {
								wrapperElement = document.createElement("strong");
							} else if (mark === "zettel.em") {
								wrapperElement = document.createElement("em");
							} else if (mark === "zettel.code") {
								wrapperElement = document.createElement("code");
							}
							// Handle keyed marks (like link)
							else if (markDef && markDef._type === "zettel.link") {
								const linkDef = markDef as ZettelLinkMarkDef;
								wrapperElement = document.createElement("a");
								wrapperElement.setAttribute("href", linkDef.href);
								wrapperElement.setAttribute("data-zettel-mark-key", mark); // Use the mark key
							}
							// Add other marks here

							if (wrapperElement) {
								// Standard/keyed mark: nest the wrapper
								innermostElement.appendChild(wrapperElement);
								innermostElement = wrapperElement;
							} else {
								// Unknown/custom mark: do nothing here, will be handled by data-zettel-marks
							}
						}
					}

					// 4. Add text content to the innermost element
					innermostElement.textContent = span.text;

					// 5. Add the data-zettel-marks attribute containing ALL marks to the outer span
					if (span.marks && span.marks.length > 0) {
						try {
							outerSpanElement.setAttribute("data-zettel-marks", JSON.stringify(span.marks));
						} catch (e) {
							console.error("Failed to serialize marks:", e);
						}
					}

					// 6. Append the completed outer span to the paragraph
					pElement.appendChild(outerSpanElement);
				}
				// Note: MarkDefs are not handled yet
				container.appendChild(pElement);
			}
			// Handle other block styles if necessary (h1, h2, etc.)
		}
		// Handle other block types if necessary
	}

	// Return the content of the container, wrapped in the div itself
	return container.outerHTML;
}

function parseZettelHtml(rootElement: Element): ZettelDoc {
	const resultingDoc: ZettelDoc = [];
	for (const element of rootElement.children) {
		if (element.tagName === "P") {
			const pElement = element as HTMLParagraphElement;
			const spans: ZettelSpan[] = [];
			let parsedMarkDefs: MarkDef[] | undefined = undefined;

			// Parse markDefs from the paragraph element
			const markDefsAttr = pElement.getAttribute("data-zettel-mark-defs");
			if (markDefsAttr) {
				try {
					parsedMarkDefs = JSON.parse(markDefsAttr);
				} catch (e) {
					console.error("Failed to parse markDefs attribute:", e);
				}
			}

			for (const outerSpanElement of Array.from(pElement.children)) {
				if (!(outerSpanElement instanceof HTMLElement) || outerSpanElement.tagName !== "SPAN") {
					continue;
				}
				const keyAttr = outerSpanElement.getAttribute("data-zettel-key");
				const key = keyAttr ?? undefined;
				let allMarks: string[] = [];
				const marksAttr = outerSpanElement.getAttribute("data-zettel-marks");
				if (marksAttr) {
					try {
						allMarks = JSON.parse(marksAttr);
						if (!Array.isArray(allMarks)) {
							console.error("Parsed data-zettel-marks is not an array:", allMarks);
							allMarks = [];
						}
					} catch (e) {
						console.error("Failed to parse data-zettel-marks attribute:", e);
					}
				}
				let text = "";
				let currentElement: Element = outerSpanElement;
				while (true) {
					const firstChild = currentElement.childNodes[0];
					if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
						text = firstChild.textContent || "";
						break;
					}
					if (firstChild && firstChild.nodeType === Node.ELEMENT_NODE) {
						currentElement = firstChild as Element;
					} else {
						text = currentElement.textContent || "";
						break;
					}
				}
				spans.push(
					createZettelSpan({
						_key: key,
						text,
						marks: allMarks.length > 0 ? allMarks : undefined,
					})
				);
			}
			const blockKeyAttr = pElement.getAttribute("data-zettel-key");
			resultingDoc.push(
				createZettelTextBlock({
					_key: blockKeyAttr ?? undefined,
					style: "zettel.normal",
					children: spans,
					markDefs: parsedMarkDefs,
				})
			);
		}
	}
	return resultingDoc;
}

function parseUnknownHtml(container: HTMLElement): ZettelDoc {
	const resultingDoc: ZettelDoc = [];
	const blockElements = ["P", "DIV"];
	const topLevel = Array.from(container.children);

	function walkInline(node: Node, marks: string[] = []): ZettelSpan[] {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent ?? "";
			if (text.length === 0) return [];
			return [createZettelSpan({ text, marks: marks.length > 0 ? [...marks] : undefined })];
		}
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement;
			let nextMarks = [...marks];
			if (el.tagName === "EM") nextMarks.push("zettel.em");
			if (el.tagName === "STRONG") nextMarks.push("zettel.strong");
			// Add more tag-to-mark mappings as needed

			let spans: ZettelSpan[] = [];
			el.childNodes.forEach(child => {
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
		resultingDoc.push(
			createZettelTextBlock({
				style: "zettel.normal",
				children: spans,
			})
		);
	});
	return resultingDoc;
}

export function fromHtml(html: string): ZettelDoc {
	const container = document.createElement("div");
	container.innerHTML = html;
	const rootElement = container.firstElementChild;
	if (rootElement && rootElement.tagName === "DIV" && rootElement.hasAttribute("data-zettel-doc")) {
		return parseZettelHtml(rootElement);
	}
	return parseUnknownHtml(container);
}
