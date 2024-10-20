import type { CSSRuleObject } from "tailwindcss/types/config";

/**
 * Each color variant that is supposed to lead to a dedicated component.
 *
 * The function interpolates an object with tokens such as `bg-${token}`
 * to `bg-primary` for example. The result is a Tailwind CSS-in-JS object.
 * Read more [here](https://tailwindcss.com/docs/plugins#css-in-js-syntax).
 *
 * @see [test cases](./forEachColorToken.test.cts)
 *
 * @example
 *    forEachColorToken(["primary", "secondary", "error"], {
 *		".button-${token}": {
 *			color: "theme(colors.${token})",
 *		},
 *	});
 */
export function forEachColorToken(
  tokens: string[],
  css: CSSRuleObject,
): CSSRuleObject {
  // 1. stringify the css rule
  // 2. replace the tokens in the stringified css
  // 3. merge the resulting css rules into one object (Object.assign)
  const result: CSSRuleObject = {};
  const cssAsString = JSON.stringify(css);
  for (const token of tokens) {
    const withReplacedTokens = cssAsString.replaceAll("${token}", token);
    Object.assign(result, JSON.parse(withReplacedTokens));
  }
  return result;
}
