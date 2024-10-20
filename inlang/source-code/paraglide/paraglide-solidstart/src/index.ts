import * as solid from "solid-js";
import * as solid_web from "solid-js/web";
import * as router from "@solidjs/router";

/**
 * Normalize a pathname.
 * (e.g. "/foo" → "/foo")
 * (e.g. "foo" → "/foo")
 */
export function normalizePathname(pathname: string): string {
  return pathname[0] === "/" ? pathname : "/" + pathname;
}

/**
 * Get the language tag from the URL.
 *
 * @param pathname The pathname to check. (e.g. "/en/foo") (use {@link normalizePathname} first)
 * @param all_language_tags All available language tags. (From paraglide, e.g. "en", "de")
 * @returns The language tag from the URL, or `undefined` if no language tag was found.
 */
export function languageTagFromPathname<T extends string>(
  pathname: string,
  all_language_tags: readonly T[],
): T | undefined {
  for (const tag of all_language_tags) {
    if (
      pathname.startsWith(tag, 1) &&
      (pathname.length === tag.length + 1 || pathname[tag.length + 1] === "/")
    ) {
      return tag;
    }
  }
  return undefined;
}

/**
 * Changes a provided url to include the correct language tag.
 *
 * To be used on `<A href="...">` components to make sure that the anchor tag will link to the correct language, when server side rendered.
 *
 * **Use only on internal links. (e.g. `<A href="/foo">` or `<A href="/en/foo">`)**
 *
 * @param pathname The pathname to link to. (e.g. "/foo/bar")
 * @param page_language_tag The current language tag. (e.g. "en")
 * @param available_language_tags All available language tags. (From paraglide, e.g. "en", "de")
 * @param source_language_tag The source language tag. (From paraglide, e.g. "en")
 * @returns The translated pathname. (e.g. "/en/bar")
 */
export function translateHref<T extends string>(
  pathname: string,
  page_language_tag: T,
  available_language_tags: readonly T[],
): string {
  const to_normal_pathname = normalizePathname(pathname);
  const to_language_tag = languageTagFromPathname(
    to_normal_pathname,
    available_language_tags,
  );

  return to_language_tag
    ? to_normal_pathname.replace(to_language_tag, page_language_tag)
    : "/" + page_language_tag + to_normal_pathname;
}

/**
 * Returns the current pathname. From request on server, from window on client.
 *
 * Use with {@link languageTagFromPathname} to get the language tag from the URL.
 *
 * @example
 * ```ts
 * const pathname = useLocationPathname()
 * const language_tag = languageTagFromPathname(pathname, all_language_tags)
 * ```
 */
export function useLocationPathname(): string {
  return solid_web.isServer
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      new URL(solid_web.getRequestEvent()!.request.url).pathname
    : window.location.pathname;
}

/**
 * The compiled paraglide runtime module.
 * (e.g. "paraglide/runtime.js")
 */
export interface Paraglide<T extends string> {
  readonly setLanguageTag: (language_tag: T | (() => T)) => void;
  readonly languageTag: () => T;
  readonly onSetLanguageTag: (callback: (language_tag: T) => void) => void;
  readonly availableLanguageTags: readonly T[];
  readonly sourceLanguageTag: T;
}

export interface I18n<T extends string> {
  readonly languageTag: solid.Accessor<T>;
  readonly setLanguageTag: (language_tag: T) => void;
  readonly LanguageTagProvider: solid.ContextProviderComponent<T>;
}

/**
 * Initialize Paraglide-SolidStart
 *
 * @param paraglide The compiled paraglide runtime module. (e.g. "paraglide/runtime.js")
 * @returns An i18n instance
 * @example
 * ```ts
 * import * as paraglide from '../paraglide/runtime.js'
 *
 * export const {LanguageTagProvider, languageTag, setLanguageTag} = adapter.createI18n(paraglide)
 * ```
 */
export function createI18n<T extends string>(paraglide: Paraglide<T>): I18n<T> {
  let languageTag: I18n<T>["languageTag"];
  let setLanguageTag: I18n<T>["setLanguageTag"];
  let LanguageTagProvider: I18n<T>["LanguageTagProvider"];

  // SERVER
  if (solid_web.isServer) {
    const LanguageTagCtx = solid.createContext<T>();
    LanguageTagProvider = LanguageTagCtx.Provider;

    setLanguageTag = () => {
      throw new Error("setLanguageTag not available on server");
    };
    languageTag = () => {
      const ctx = solid.useContext(LanguageTagCtx);
      if (!ctx) {
        throw new Error("LanguageTagCtx not found");
      }
      return ctx;
    };

    paraglide.setLanguageTag(languageTag);
  }
  // BROWSER
  else {
    let language_tag: T;

    LanguageTagProvider = (props) => {
      language_tag = props.value;
      paraglide.setLanguageTag(language_tag);

      const navigate = router.useNavigate();

      /*
			Keep the language tag in the URL
			*/
      router.useBeforeLeave((e) => {
        if (typeof e.to !== "string") return;

        const from_pathname = normalizePathname(e.from.pathname);
        const from_language_tag = languageTagFromPathname(
          from_pathname,
          paraglide.availableLanguageTags,
        );
        const to_pathname = normalizePathname(e.to);
        const to_language_tag = languageTagFromPathname(
          to_pathname,
          paraglide.availableLanguageTags,
        );

        //  /en/foo → /en/bar  |  /foo → /bar
        if (to_language_tag === from_language_tag) return;

        e.preventDefault();

        //  /en/foo → /bar  |  /de/foo → /bar
        if (!to_language_tag) {
          navigate("/" + from_language_tag + to_pathname, e.options);
        }
        //  /foo → /en/bar
        else if (
          to_language_tag === paraglide.sourceLanguageTag &&
          !from_language_tag
        ) {
          navigate(to_pathname.slice(to_language_tag.length + 1), e.options);
        }
        //  /de/foo → /en/bar  |  /foo → /de/bar
        else {
          location.pathname = to_pathname;
        }
      });

      return props.children;
    };

    setLanguageTag = paraglide.setLanguageTag;
    languageTag = () => language_tag;

    paraglide.onSetLanguageTag((new_language_tag) => {
      if (new_language_tag === language_tag) return;
      const pathname = normalizePathname(location.pathname);
      location.pathname =
        "/" + new_language_tag + pathname.replace("/" + language_tag, "");
    });
  }

  return {
    languageTag,
    setLanguageTag,
    LanguageTagProvider,
  };
}
