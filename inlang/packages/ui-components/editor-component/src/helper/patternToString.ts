import type { Pattern } from "@inlang/sdk";

/**
 * MVP version of the function
 *
 * Converts a pattern to a string.
 * @param props.pattern The pattern to convert to a string.
 * @returns The pattern as a string.
 *
 * @example
 * patternToString({ pattern: [{ value: "Hello" }, { type: "expression", arg: { type: "variable-reference", name: "name" } }] }) -> "Hello {name}"
 */

const patternToString = (props: { pattern: Pattern }): string => {
  if (!props.pattern) {
    return "";
  }
  return props.pattern
    .map((p) => {
      if ("value" in p) {
        return p.value;
      } else if (
        p.type === "expression" &&
        p.arg.type === "variable-reference"
      ) {
        return `{${p.arg.name}}`;
      }
      return "";
    })
    .join("");
};

export default patternToString;
