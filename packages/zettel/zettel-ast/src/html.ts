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

export function fromHtml(html: string): ZettelDoc {
	const container = document.createElement("div");
	container.innerHTML = html; // Parse the HTML string

	const resultingDoc: ZettelDoc = [];

	// Get the actual root element parsed from the string (should be the first child)
	const rootElement = container.firstElementChild;

	// Check if we got the expected root element (a DIV)
	if (rootElement && rootElement.tagName === "DIV") {
		// Iterate over the children of the *parsed* root div
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
						// Optional: Add validation for the parsed markDefs structure here
					} catch (e) {
						console.error("Failed to parse markDefs attribute:", e);
						// Handle error, maybe default to undefined
					}
				}

				// Use for...of loop for children of P (expecting outer SPANs)
				for (const outerSpanElement of Array.from(pElement.children)) {
					// Ensure it's an element and specifically a SPAN
					if (!(outerSpanElement instanceof HTMLElement) || outerSpanElement.tagName !== "SPAN") {
						continue; // Skip unexpected elements
					}

					// 1. Get key from the outer SPAN
					const keyAttr = outerSpanElement.getAttribute("data-zettel-key");
					const key = keyAttr ?? undefined;

					// 1. Parse ALL marks solely from the data-zettel-marks attribute
					let allMarks: string[] = [];
					const marksAttr = outerSpanElement.getAttribute("data-zettel-marks");
					if (marksAttr) {
						try {
							allMarks = JSON.parse(marksAttr);
							if (!Array.isArray(allMarks)) {
								console.error("Parsed data-zettel-marks is not an array:", allMarks);
								allMarks = []; // Reset to empty on invalid format
							}
						} catch (e) {
							console.error("Failed to parse data-zettel-marks attribute:", e);
							// Keep allMarks as empty array
						}
					}

					// 2. Traverse inwards from the outer SPAN to find the final text node
					// We IGNORE the tags for mark reconstruction now.
					let text = "";
					let currentElement: Element = outerSpanElement;

					while (true) {
						const firstChild = currentElement.childNodes[0];

						// Base case: Found the text node
						if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
							text = firstChild.textContent || "";
							break;
						}

						// Recursive step: Found an element node (mark tag)
						if (firstChild && firstChild.nodeType === Node.ELEMENT_NODE) {
							currentElement = firstChild as Element; // Move inwards
						} else {
							text = currentElement.textContent || ""; // Fallback
							break;
						}
					}

					// 3. Create the ZettelSpan
					spans.push(
						createZettelSpan({
							_key: key,
							text,
							marks: allMarks.length > 0 ? allMarks : undefined,
						})
					);
				}

				// Add markDefs parsing here later if needed
				const blockKeyAttr = pElement.getAttribute("data-zettel-key");
				// Create a new block, preserving the key if found, assuming 'zettel.normal' style
				// Note: MarkDefs are not handled yet
				resultingDoc.push(
					createZettelTextBlock({
						_key: blockKeyAttr ?? undefined, // Pass key or undefined
						style: "zettel.normal", // Assuming normal style for now
						children: spans,
						markDefs: parsedMarkDefs, // Assign the parsed markDefs
					})
				);
			}
			// Handle other block-level elements (H1, H2, UL, etc.)
		}
	} else {
		throw new Error("Input HTML did not contain expected root <div>");
	}

	return resultingDoc;
}
