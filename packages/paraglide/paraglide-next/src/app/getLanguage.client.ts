import { languageTag } from "$paraglide/runtime.js";

/**
 * Returns the current language tag.
 * (client-side way)
 */
export function getLanguage<T extends string>(): T {
  return languageTag() as T;
}
