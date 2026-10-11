---
"@inlang/plugin-next-intl": minor
---

Analyze where a next-intl app uses messages (`analyzeUsage`), so that the SDK's `unused-message` check and `findUsages`, `inlang check --unused-messages` and Fink work for next-intl projects. No other plugin is needed.

A message such as `Home.title` is used by `useTranslations("Home")` or `getTranslations("Home")` (also `getTranslations({ locale, namespace })` and `createTranslator({ namespace })`) followed by `t("title")`, `t.rich("title")` or `t.markup("title")`, or by `t("Home.title")` without a namespace. Aliases, renamed and namespace imports, constant keys, ternaries and arrays of keys that are only iterated (`keys.map((key) => t(key))`) resolve. Server and Client Components in `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` and `.mdx` files are read.

Anything that can't be resolved makes the analysis incomplete, with the file, line and column: then no message is reported unused or deleted. That includes dynamic keys and namespaces (``t(`items.${id}`)``, `t(key)`), a translator passed to a function or component, returned from a custom hook or exported, next-intl functions imported from a wrapper module or package, `t.raw()` and `t.has()` of a key that could be a namespace, `useMessages()` and `getMessages()` other than for `NextIntlClientProvider`, message files read directly or nested where the plugin doesn't put them, re-exports of next-intl, `useExtracted()`, and types derived from the message keys (`MessageKeys`, `keyof Messages`, `keyof IntlMessages["Nav"]`, `Parameters<typeof t>`). Passing all messages to `NextIntlClientProvider` or `getRequestConfig`, and typing next-intl with `Messages: typeof messages`, keep the analysis complete.
