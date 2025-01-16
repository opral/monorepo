import type { Pattern } from "@inlang/sdk";
import { escapeForTemplateLiteral } from "../services/codegen/escape.js";
import { backtick } from "../services/codegen/quotes.js";
import { compileExpression } from "./compile-expression.js";
import type { Compiled } from "./types.js";
import type { Registry } from "./registry.js";

/**
 * Compiles a pattern into a template literal string.
 *
 * @example
 *  const { compiled, params } = compilePattern([{ type: "Text", value: "Hello " }, { type: "VariableReference", name: "name" }])
 *  >> compiled === "`Hello ${i.name}`"
 */
export const compilePattern = (
	lang: string,
	pattern: Pattern,
	registry: Registry
): Compiled<Pattern> => {
	const compiledPatternElements = pattern.map(
		(element): Compiled<Pattern[number]> => {
			switch (element.type) {
				case "text":
					return {
						code: escapeForTemplateLiteral(element.value),
						node: element,
					};
				case "expression": {
					const compiledExpression = compileExpression(lang, element, registry);
					const code = "${" + compiledExpression.code + "}";
					return { code, node: element };
				}
			}
		}
	);
	const code = backtick(
		compiledPatternElements.map((res) => res.code).join("")
	);

	return { code, node: pattern };
};
