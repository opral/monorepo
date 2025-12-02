import type { Declaration, Pattern, VariableReference } from "@inlang/sdk";
import type { Compiled } from "./types.js";
import { escapeForTemplateLiteral } from "../services/codegen/escape.js";

/**
 * Compiles a pattern into a template literal string.
 *
 * @example
 *   const pattern: Pattern = [
 * 	 { type: "text", value: "Your age is " },
 * 	 { type: "expression", arg: { type: "variable-reference", name: "age" } },
 *   ]
 *
 *   const { code } = compilePattern({ pattern, declarations: [{ type: "input-variable", name: "age" }] });
 *
 *   // code will be: `Your age is ${i?.age}`
 */
export const compilePattern = (args: {
	pattern: Pattern;
	declarations: Declaration[];
}): Compiled<Pattern> => {
	let result = "";

	for (const part of args.pattern) {
		if (part.type === "text") {
			result += escapeForTemplateLiteral(part.value);
		} else {
			if (part.arg.type === "variable-reference") {
				const declaration = args.declarations.find(
					(decl) => decl.name === (part.arg as VariableReference).name
				);
				if (declaration?.type === "input-variable") {
					result += `\${i?.${part.arg.name}}`;
				} else if (declaration?.type === "local-variable") {
					result += `\${${part.arg.name}}`;
				} else {
					throw new Error(
						`Variable reference "${part.arg.name}" not found in declarations`
					);
				}
			}
		}
	}

	return {
		code: `\`${result}\``,
		node: args.pattern,
	};
};
