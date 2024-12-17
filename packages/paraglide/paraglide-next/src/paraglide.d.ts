export interface Paraglide<T extends string> {
  readonly setLanguageTag: (language_tag: T | (() => T)) => void;
  readonly languageTag: () => T;
  readonly onSetLanguageTag: (callback: (language_tag: T) => void) => void;
  readonly isAvailableLanguageTag: (thing: any) => thing is T;
  readonly availableLanguageTags: readonly T[];
  readonly sourceLanguageTag: T;
}
