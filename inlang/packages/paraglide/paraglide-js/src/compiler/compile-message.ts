import type { Declaration, Message, Variant } from "@inlang/sdk";
import type { Registry } from "./registry.js";
import { compilePattern } from "./compile-pattern.js";
import type { Compiled } from "./types.js";
import { doubleQuote } from "../services/codegen/quotes.js";
import { inputsType } from "./jsdoc-types.js";

/**
 * Returns the compiled message as a string
 *
 */
export const compileMessage = (
	declarations: Declaration[],
	message: Message,
	variants: Variant[],
	registry: Registry
): Compiled<Message> => {
	// return empty string instead?
	if (variants.length == 0) {
		throw new Error("Message must have at least one variant");
	}

	const hasMultipleVariants = variants.length > 1;
	return hasMultipleVariants
		? compileMessageWithMultipleVariants(
				declarations,
				message,
				variants,
				registry
			)
		: compileMessageWithOneVariant(declarations, message, variants, registry);
};

function compileMessageWithOneVariant(
	declarations: Declaration[],
	message: Message,
	variants: Variant[],
	registry: Registry
): Compiled<Message> {
	const variant = variants[0];
	if (!variant || variants.length !== 1) {
		throw new Error("Message must have exactly one variant");
	}
	const inputs = declarations.filter((decl) => decl.type === "input-variable");
	const hasInputs = inputs.length > 0;
	const compiledPattern = compilePattern(
		message.locale,
		variant.pattern,
		registry
	);
	const code = `/** @type {(inputs: ${inputsType(inputs)}) => string} */
export const ${message.bundleId} = (${hasInputs ? "i" : ""}) => ${compiledPattern.code};`;
	return { code, node: message };
}

function compileMessageWithMultipleVariants(
	declarations: Declaration[],
	message: Message,
	variants: Variant[],
	registry: Registry
): Compiled<Message> {
	if (variants.length <= 1) {
		throw new Error("Message must have more than one variant");
	}

	const inputs = declarations.filter((decl) => decl.type === "input-variable");
	const hasInputs = inputs.length > 0;

	// TODO make sure that matchers use keys instead of indexes
	const compiledVariants = [];

	for (const variant of variants) {
		const compiledPattern = compilePattern(
			message.locale,
			variant.pattern,
			registry
		);

		// todo account for all matches in the selector (if a match is missing, it should be the catchall)
		const isCatchAll = variant.matches.every(
			(match) => match.type === "catchall-match"
		);

		if (isCatchAll) {
			compiledVariants.push(`return ${compiledPattern.code}`);
		}

		const conditions: string[] = [];

		for (const match of variant.matches) {
			// catch all matches are not used in the conditions
			if (match.type !== "literal-match") {
				continue;
			}
			const variableType = declarations.find(
				(decl) => decl.name === match.key
			)?.type;
			if (variableType === "input-variable") {
				conditions.push(`i.${match.key} == ${doubleQuote(match.value)}`);
			} else if (variableType === "local-variable") {
				conditions.push(`${match.key} == ${doubleQuote(match.value)}`);
			}
		}

		if (conditions.length === 0) continue;
		compiledVariants.push(
			`if (${conditions.join(" && ")}) return ${compiledPattern.code};`
		);
	}

	const code = `/** @type {(inputs: ${inputsType(inputs)}) => string} */
export const ${message.bundleId} = (${hasInputs ? "i" : ""}) => {
	${compiledVariants.join("\n\t")}
};`;

	return { code, node: message };
}
