import type { BundleNested } from "../../database/schema.js";
import type { Pattern } from "../pattern.js";
import type {
	ExpressionV1,
	MessageV1,
	PatternV1,
	VariantV1,
} from "./schemaV1.js";

/**
 * Converts a BundleNested into a legacy format.
 *
 * @throws If the message cannot be represented in the v1 format
 */
export function toMessageV1(bundle: BundleNested): MessageV1 {
	const variants: VariantV1[] = [];
	const selectorNames = new Set<string>();

	for (const message of bundle.messages) {
		// collect all selector names
		for (const selector of message.selectors.map((s) => ({
			type: "variable-reference",
			name: s.name,
		}))) {
			selectorNames.add(selector.name);
		}

		// collect all variants
		for (const variant of message.variants) {
			variants.push({
				languageTag: message.locale,
				match: [],
				pattern: toV1Pattern(variant.pattern),
			});
		}
	}

	const selectors: ExpressionV1[] = [...selectorNames].map((name) => ({
		type: "VariableReference",
		name,
	}));

	return {
		id: bundle.id,
		alias: {},
		variants,
		selectors,
	};
}

/**
 * @throws If the pattern cannot be represented in the v1 format
 */
function toV1Pattern(pattern: Pattern): PatternV1 {
	return pattern.map((element) => {
		switch (element.type) {
			case "text": {
				return {
					type: "Text",
					value: element.value,
				};
			}

			case "expression": {
				if (element.arg.type === "variable-reference") {
					return {
						type: "VariableReference",
						name: element.arg.name,
					};
				}
				throw new Error(`Unsupported expression argument type`);
			}

			default: {
				throw new Error(`Unsupported pattern element type`);
			}
		}
	});
}
