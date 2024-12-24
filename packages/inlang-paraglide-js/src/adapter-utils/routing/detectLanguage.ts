/**
 * Detects the language tag from the path if present
 *
 * If the path is not in the base path, no language will be detected
 * If the language is not available, no language will be detected
 *
 * The language is not case sensitive, eg /de-ch/ and /DE_CH/ will both return "de-CH" if present
 *
 * @example
 * /base/de/ueber-uns -> de
 *
 * /base/about -> undefined because it does not explicitly include the language
 * /en/about -> undefined because the path is not in the base
 *
 * @returns the language tag if present
 *
 */
export function detectLanguageFromPath<T extends string>({
  path,
  availableLanguageTags,
  base,
}: {
  /** The absolute path including the base */
  path: string;
  availableLanguageTags: readonly T[];
  /** The base path */
  base?: string;
}): T | undefined {
  base ??= "";
  if (base === "/") base = "";
  if (!path.startsWith(base)) return undefined;
  const pathWithoutBase = path.replace(base, "");

  const maybeLang = pathWithoutBase.split("/")[1];
  if (!maybeLang) return undefined;

  return availableLanguageTags.map(lower).includes(lower(maybeLang))
    ? (maybeLang as T)
    : undefined;
}

const lower = (s: string) => s.toLowerCase();
