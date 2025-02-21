# Multi-Tenancy

URLPatterns can be used to configure multi-tenancy in your application.

## Configuration

To set up multi-tenancy, define URL patterns. Here is an example configuration:

```javascript
await compile({
	project: "./project.inlang",
	urlPatterns: [
		// 1) customer1.fr => root locale is fr, sub-locale is /en/
		{
			pattern: ":protocol://customer1.fr/:locale(en)?/:path(.*)?",
			deLocalizedNamedGroups: { locale: null },
			localizedNamedGroups: {
				en: { locale: "en" },
				fr: { locale: null },
			},
		},
		// 2) customer2.com => root locale is en, sub-locale is /fr/
		{
			pattern: ":protocol://customer2.com/:locale(fr)?/:path(.*)?",
			localizedNamedGroups: {
				en: { locale: null },
				fr: { locale: "fr" },
			},
			deLocalizedNamedGroups: { locale: "fr" },
		},
		// 3) Any other domain => path-based for en/fr
		{
			pattern: ":protocol://:domain(.*)/:locale/:path(.*)?",
			deLocalizedNamedGroups: {},
			localizedNamedGroups: {
				en: { locale: "en" },
				fr: { locale: "fr" },
			},
		},
	],
});
```

### Customer 1

- Localizing French to French:

  ```javascript
  localizeHref("https://customer1.fr/about", { locale: "fr" });
  // Output: "https://customer1.fr/about"
  ```

- Localizing from French to English:

  ```javascript
  localizeHref("https://customer1.fr/about", { locale: "en" });
  // Output: "https://customer1.fr/en/about"
  ```

- De-localizing French:
  ```javascript
  deLocalizeHref("https://customer1.fr/en/about");
  // Output: "https://customer1.fr/about"
  ```

### Customer 2

- Localizing English to English:

  ```javascript
  localizeHref("https://customer2.com/about", { locale: "en" });
  // Output: "https://customer2.com/about"
  ```

- Localizing from English to French:

  ```javascript
  localizeHref("https://customer2.com/about", { locale: "fr" });
  // Output: "https://customer2.com/fr/about"
  ```

- De-localizing French:
  ```javascript
  runtime.deLocalizeUrl("https://customer2.com/about").href;
  // Output: "https://customer2.com/fr/about"
  ```

### Other Domains

For any other domain, the path-based localization will be used for English and French.

```javascript
localizeHref("https://example.com/about", { locale: "fr" });
// Output: "https://example.com/fr/about"

localizeHref("https://example.com/fr/about", { locale: "en" });
// Output: "https://example.com/about"
```
