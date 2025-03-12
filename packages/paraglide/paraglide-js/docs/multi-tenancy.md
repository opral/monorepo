# Multi-Tenancy

https://customer1.com/about -> de
https://customer2.de/en/about -> en
https://customer3.com/fr/about -> fr

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
	strategy: ["url"],
	urlPatterns: [
		// 1) customer1.fr => root locale is fr, sub-locale is /en/
		{
			pattern: "https://customer1.fr/:path(.*)?",
			localized: [
				["fr", "https://customer1.fr/:path(.*)?"],
				["en", "https://customer1.fr/en/:path(.*)?"],
			],
		},
		// 2) customer2.com => root locale is en, sub-locale is /fr/
		{
			pattern: "https://customer2.com/:path(.*)?",
			localized: [
				["en", "https://customer2.com/:path(.*)?"],
				["fr", "https://customer2.com/fr/:path(.*)?"],
			],
		},
		// 3) Any other domain => path-based for en/fr
		{
			pattern: "https://:domain(.*)/:path(.*)?",
			localized: [
				["en", "https://:domain(.*)/en/:path(.*)?"],
				["fr", "https://:domain(.*)/fr/:path(.*)?"],
			],
		},
	],
});
```

### Customer 1

- Localizing French to French:

  ```javascript
  localizeHref("https://customer1.fr/about", { locale: "fr" })
  // Output: "https://customer1.fr/about"
  ```

- Localizing from French to English:

  ```javascript
  localizeHref("https://customer1.fr/about", { locale: "en" })
  // Output: "https://customer1.fr/en/about"
  ```

- De-localizing English:
  ```javascript
  deLocalizeHref("https://customer1.fr/en/about");
  // Output: "https://customer1.fr/about"
  ```

### Customer 2

- Localizing English to English:

  ```javascript
  localizeHref("https://customer2.com/about", { locale: "en" })
  // Output: "https://customer2.com/about"
  ```

- Localizing from English to French:

  ```javascript
  localizeHref("https://customer2.com/about", { locale: "fr" })
  // Output: "https://customer2.com/fr/about"
  ```

- De-localizing French:
  ```javascript
  deLocalizeHref("https://customer2.com/fr/about");
  // Output: "https://customer2.com/about"
  ```

### Other Domains

For any other domain, the path-based localization will be used for English and French.

```javascript
localizeHref("https://example.com/about", { locale: "fr" })
// Output: "https://example.com/fr/about"

localizeHref("https://example.com/fr/about", { locale: "en" })
// Output: "https://example.com/en/about"

```

## Disabling Specific Locales for Tenants

In multi-tenant applications, you might need to restrict certain locales for specific tenants. For example:

- Customer A only supports English and German
- Customer B only supports French and Spanish
- Customer C supports all locales

You can implement this by redirecting unsupported locales to a 404 page or any other error page using the `null` or 404 redirect pattern:

```javascript
await compile({
	project: "./project.inlang",
	strategy: ["url"],
	urlPatterns: [
		// Define 404 pages for each tenant
		{
			pattern: "https://customer1.com/404",
			localized: [
				["en", "https://customer1.com/404"],
				["de", "https://customer1.com/de/404"],
				// No fr pattern - will use the en pattern as fallback
			],
		},
		// Customer1 - only supports en and de
		{
			pattern: "https://customer1.com/:path(.*)?",
			localized: [
				["en", "https://customer1.com/:path(.*)?"],
				["de", "https://customer1.com/de/:path(.*)?"],
				["fr", "https://customer1.com/404"],  // Redirect fr to 404
				["es", "https://customer1.com/404"],  // Redirect es to 404
			],
		},
		// Customer2 - only supports fr and es
		{
			pattern: "https://customer2.com/:path(.*)?",
			localized: [
				["fr", "https://customer2.com/:path(.*)?"],
				["es", "https://customer2.com/es/:path(.*)?"],
				["en", "https://customer2.com/404"],  // Redirect en to 404
				["de", "https://customer2.com/404"],  // Redirect de to 404
			],
		},
		// Customer3 - supports all locales
		{
			pattern: "https://customer3.com/:path(.*)?",
			localized: [
				["en", "https://customer3.com/:path(.*)?"],
				["de", "https://customer3.com/de/:path(.*)?"],
				["fr", "https://customer3.com/fr/:path(.*)?"],
				["es", "https://customer3.com/es/:path(.*)?"],
			],
		},
	],
});
```

When a user tries to access a URL with an unsupported locale for a specific tenant, they will be redirected to the 404 page:

```javascript
// Customer1 doesn't support French
localizeHref("https://customer1.com/about", { locale: "fr" })
// Output: "https://customer1.com/404"

// Customer2 doesn't support German
localizeHref("https://customer2.com/about", { locale: "de" })
// Output: "https://customer2.com/404"

// Customer3 supports all locales
localizeHref("https://customer3.com/about", { locale: "fr" })
// Output: "https://customer3.com/fr/about"
```

This approach allows you to:

1. Define tenant-specific locale support
2. Gracefully handle unsupported locale requests
3. Maintain a consistent user experience across your multi-tenant application



## Tenant-Specific Locale Switchers

When implementing a language/locale switcher in a multi-tenant application, it's essential to only display the locales that are supported by the current tenant. 

This prevents users from clicking on links that would lead to 404 pages or unsupported content.

### Filtering Available Locales

You should filter the available locales based on the current tenant before rendering your locale switcher:

```javascript
// Example of filtering locales for a language switcher
function getTenantSupportedLocales(hostname) {
  // Determine which tenant we're on based on hostname
  if (hostname.includes('customer1.com')) {
    // Customer1 only supports English and German
    return ['en', 'de'];
  } else if (hostname.includes('customer2.com')) {
    // Customer2 only supports French and Spanish
    return ['fr', 'es'];
  } else if (hostname.includes('customer3.com')) {
    // Customer3 supports all locales
    return ['en', 'de', 'fr', 'es'];
  }
}

// In your language switcher component
function LanguageSwitcher() {
  const hostname = window.location.hostname;
  const supportedLocales = getTenantSupportedLocales(hostname);
  
  return (
    <div className="language-switcher">
      {supportedLocales.map(locale => (
        <a 
          key={locale} 
          href={localizeHref(window.location.href, { locale })}
        >
          {locale.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
```

