# Multi-Tenancy

```
https://customer1.com/about -> de
https://customer2.de/en/about -> en
https://customer3.com/fr/about -> fr
```

Multi-tenancy in i18n refers to serving different localization configurations. This is particularly useful when:

- You have multiple customer domains that need different default languages
- You're running a SaaS platform where each customer has their own subdomain
- Different sections of your app need different localization strategies

For example, you might want:

- `customer1.fr` to default to French with English as an option
- `customer2.com` to default to English with French as an option
- All other domains to use path-based localization (`/en/`, `/fr/`)

Multi-tenancy allows you to handle all these cases with a single configuration.

## Use Cases

- **Regional Businesses**: Different domains for different markets (e.g., `.fr` for France, `.de` for Germany)
- **White-Label Solutions**: Each client gets their own domain with specific language preferences
- **Enterprise Applications**: Different departments or subsidiaries need different language defaults

## Configuration

URLPatterns can be used to configure multi-tenancy in your application. Here is an example configuration:

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
  deLocalizeHref("https://customer2.com/about");
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
