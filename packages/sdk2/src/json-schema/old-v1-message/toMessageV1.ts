import type { BundleNested } from "../../database/schema.js";
import type { InlangPlugin } from "../../plugin/schema.js";
import type { Expression, Pattern } from "../pattern.js";
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
export function toMessageV1(
	bundle: BundleNested,
	pluginKey: NonNullable<InlangPlugin["key"] | InlangPlugin["id"]>
): MessageV1 {
	const variants: VariantV1[] = [];
	const selectorNames = new Set<string>();

	for (const message of bundle.messages) {
		// collect all selector names
		for (const selector of message.selectors.map(toV1Expression)) {
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

	const alias = bundle.alias[pluginKey];

	if (alias === undefined) {
		throw new Error(`Missing alias for plugin key "${pluginKey}"`);
	}

	return {
		id: alias,
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
				return toV1Expression(element);
			}

			default: {
				throw new Error(`Unsupported pattern element type`);
			}
		}
	});
}

function toV1Expression(expression: Expression): ExpressionV1 {
	if (expression.annotation !== undefined)
		throw new Error(
			"Cannot convert an expression with an annotation to the v1 format"
		);

	if (expression.arg.type !== "variable") {
		throw new Error("Can only convert variable references to the v1 format");
	}

	return {
		type: "VariableReference",
		name: expression.arg.name,
	};
}
