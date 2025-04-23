import type { SerializableError, ValidationResult } from "@opral/zettel-ast";

/**
 * Validates that the input HTML string is a valid Zettel HTML document.
 * - Must have a root <div data-zettel-doc="true">.
 * - Can be empty or contain valid zettel blocks and spans.
 * Returns { success: true, data } if valid, or { success: false, errors } if not.
 *
 * Assumes the DOM is available (e.g., in a browser or test env with JSDOM/happy-dom).
 */
export function validateHtmlString(html: string): ValidationResult<string> {
	const errors: SerializableError[] = [];
	if (typeof html !== "string") {
		errors.push({ message: "Input is not a string" });
		return { success: false, data: undefined, errors };
	}

	let container: HTMLElement;
	try {
		container = document.createElement("div");
		container.innerHTML = html;
	} catch (e) {
		errors.push({ message: "Could not parse HTML" });
		return { success: false, data: undefined, errors };
	}

	// Check for root div with data-zettel-doc="true"
	const rootDiv = container.querySelector('div[data-zettel-doc="true"]');
	if (!rootDiv) {
		errors.push({ message: "Missing root div with data-zettel-doc attribute" });
		return { success: false, data: undefined, errors };
	}

	// Optionally: Add more validation for blocks, spans, etc.

	if (errors.length > 0) {
		return { success: false, data: undefined, errors };
	}
	return { success: true, data: html, errors: undefined };
}
