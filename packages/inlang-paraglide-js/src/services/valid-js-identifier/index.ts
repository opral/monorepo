import { KEYWORDS } from "./reservedWords.js";

/**
 * Checks if a string is a valid JS identifier.
 * This is more reliable than just using regexes or `new Function()`.s
 */
export function isValidJSIdentifier(str: string): boolean {
  return !KEYWORDS.includes(str) && canBeUsedAsVariableName(str);
}

/**
 * is-var-name | ISC (c) Shinnosuke Watanabe
 * https://github.com/shinnn/is-var-name
 */
function canBeUsedAsVariableName(str: string): boolean {
  if (str.trim() !== str) {
    return false;
  }

  try {
    new Function(str, "var " + str);
  } catch (_) {
    return false;
  }

  return true;
}
