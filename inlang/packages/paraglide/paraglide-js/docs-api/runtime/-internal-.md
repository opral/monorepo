## Locale

> **Locale**: `any`

Defined in: [runtime/ambient.d.ts:10](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/ambient.d.ts)

***

## ParaglideAsyncLocalStorage

> **ParaglideAsyncLocalStorage**\<\>: `object`

Defined in: [runtime/variables.js:48](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

### Type Parameters

### Type declaration

#### run()

> **run**: (`store`, `cb`) => `any`

##### Parameters

###### store

###### locale?

[`Locale`](-internal-.md#locale)

###### messageCalls?

`Set`\<`string`\>

###### origin?

`string`

###### cb

`any`

##### Returns

`any`

#### getStore()

##### Returns

`undefined` \| \{ `locale`: [`Locale`](-internal-.md#locale); `messageCalls`: `Set`\<`string`\>; `origin`: `string`; \}

***

## baseLocale

> `const` **baseLocale**: `"en"` = `"en"`

Defined in: [runtime/variables.js:9](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

The project's base locale.

### Example

```ts
if (locale === baseLocale) {
    // do something
  }
```

***

## cookieName

> `const` **cookieName**: `string` = `"<cookie-name>"`

Defined in: [runtime/variables.js:22](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

***

## disableAsyncLocalStorage

> `const` **disableAsyncLocalStorage**: `false` = `false`

Defined in: [runtime/variables.js:61](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

***

## experimentalMiddlewareLocaleSplitting

> `const` **experimentalMiddlewareLocaleSplitting**: `false` = `false`

Defined in: [runtime/variables.js:63](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

***

## isServer

> `const` **isServer**: `boolean`

Defined in: [runtime/variables.js:65](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

***

## locales

> `const` **locales**: readonly \[`"en"`, `"de"`\]

Defined in: [runtime/variables.js:19](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

The project's locales that have been specified in the settings.

### Example

```ts
if (locales.includes(userSelectedLocale) === false) {
    throw new Error('Locale is not available');
  }
```

***

## serverAsyncLocalStorage

> **serverAsyncLocalStorage**: `undefined` \| [`ParaglideAsyncLocalStorage`](-internal-.md#paraglideasynclocalstorage) = `undefined`

Defined in: [runtime/variables.js:59](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

Server side async local storage that is set by `serverMiddleware()`.

The variable is used to retrieve the locale and origin in a server-side
rendering context without effecting other requests.

***

## strategy

> `const` **strategy**: (`"cookie"` \| `"baseLocale"` \| `"globalVariable"` \| `"url"` \| `"preferredLanguage"` \| `"localStorage"`)[]

Defined in: [runtime/variables.js:30](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

***

## urlPatterns

> `const` **urlPatterns**: `object`[] = `[]`

Defined in: [runtime/variables.js:37](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

The used URL patterns.

### Type declaration

#### localized

> **localized**: \[`any`, `string`\][]

#### pattern

> **pattern**: `string`

***

## assertIsLocale()

> **assertIsLocale**(`input`): `any`

Defined in: [runtime/assert-is-locale.js:11](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/assert-is-locale.js)

Asserts that the input is a locale.

### Parameters

#### input

`any`

The input to check.

### Returns

`any`

The input if it is a locale.

### Throws

If the input is not a locale.

***

## deLocalizeHref()

> **deLocalizeHref**(`href`): `string`

Defined in: [runtime/localize-href.js:104](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-href.js)

High-level URL de-localization function optimized for client-side UI usage.

This is a convenience wrapper around `deLocalizeUrl()` that provides features
needed in the UI:

- Accepts relative paths (e.g., "/de/about")
- Returns relative paths when possible
- Handles string input/output instead of URL objects

### Parameters

#### href

`string`

The href to de-localize (can be relative or absolute)

### Returns

`string`

The de-localized href, relative if input was relative

### Example

```typescript
// In a React/Vue/Svelte component
const LocaleSwitcher = ({ href }) => {
  // Remove locale prefix before switching
  const baseHref = deLocalizeHref(href);
  return locales.map(locale =>
    <a href={localizeHref(baseHref, { locale })}>
      Switch to {locale}
    </a>
  );
};

// Examples:
deLocalizeHref("/de/about")  // => "/about"
deLocalizeHref("/fr/store")  // => "/store"

// Cross-origin links remain absolute
deLocalizeHref("https://example.com/de/about")
// => "https://example.com/about"
```

For server-side URL de-localization (e.g., in middleware), use `deLocalizeUrl()`
which provides more precise control over URL handling.

### See

deLocalizeUrl - For low-level URL de-localization in server contexts

***

## deLocalizeUrl()

> **deLocalizeUrl**(`url`): `URL`

Defined in: [runtime/localize-url.js:184](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-url.js)

Low-level URL de-localization function, primarily used in server contexts.

This function is designed for server-side usage where you need precise control
over URL de-localization, such as in middleware or request handlers. It works with
URL objects and always returns absolute URLs.

For client-side UI components, use `deLocalizeHref()` instead, which provides
a more convenient API with relative paths.

### Parameters

#### url

The URL to de-localize. If string, must be absolute.

`string` | `URL`

### Returns

`URL`

The de-localized URL, always absolute

### Examples

```typescript
// Server middleware example
app.use((req, res, next) => {
  const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
  const baseUrl = deLocalizeUrl(url);

  // Store the base URL for later use
  req.baseUrl = baseUrl;
  next();
});
```

```typescript
// Using with URL patterns
const url = new URL("https://example.com/de/about");
deLocalizeUrl(url); // => URL("https://example.com/about")

// Using with domain-based localization
const url = new URL("https://de.example.com/store");
deLocalizeUrl(url); // => URL("https://example.com/store")
```

***

## extractLocaleFromCookie()

> **extractLocaleFromCookie**(): `undefined` \| `string`

Defined in: [runtime/extract-locale-from-cookie.js:12](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/extract-locale-from-cookie.js)

Extracts a cookie from the document.

Will return undefined if the docuement is not available or if the cookie is not set.
The `document` object is not available in server-side rendering, so this function should not be called in that context.

### Returns

`undefined` \| `string`

***

## extractLocaleFromRequest()

> **extractLocaleFromRequest**(`request`): `any`

Defined in: [runtime/extract-locale-from-request.js:28](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/extract-locale-from-request.js)

Extracts a locale from a request.

Use the function on the server to extract the locale
from a request.

The function goes through the strategies in the order
they are defined. If a strategy returns an invalid locale,
it will fall back to the next strategy.

### Parameters

#### request

`Request`

### Returns

`any`

### Example

```ts
const locale = extractLocaleFromRequest(request);
```

***

## extractLocaleFromUrl()

> **extractLocaleFromUrl**(`url`): `any`

Defined in: [runtime/extract-locale-from-url.js:15](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/extract-locale-from-url.js)

Extracts the locale from a given URL using native URLPattern.

### Parameters

#### url

The full URL from which to extract the locale.

`string` | `URL`

### Returns

`any`

The extracted locale, or undefined if no locale is found.

***

## generateStaticLocalizedUrls()

> **generateStaticLocalizedUrls**(`urls`): `URL`[]

Defined in: [runtime/generate-static-localized-urls.js:31](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/generate-static-localized-urls.js)

Generates a list of localized URLs for all provided URLs.

This is useful for SSG (Static Site Generation) and sitemap generation.
NextJS and other frameworks use this function for SSG.

### Parameters

#### urls

(`string` \| `URL`)[]

List of URLs to generate localized versions for. Can be absolute URLs or paths.

### Returns

`URL`[]

List of localized URLs as URL objects

### Example

```typescript
const urls = generateStaticLocalizedUrls([
  "https://example.com/about",
  "https://example.com/blog",
]);
urls[0].href // => "https://example.com/about"
urls[1].href // => "https://example.com/blog"
urls[2].href // => "https://example.com/de/about"
urls[3].href // => "https://example.com/de/blog"
...
```

***

## getLocale()

> **getLocale**(): `any`

Defined in: [runtime/get-locale.js:44](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-locale.js)

Get the current locale.

### Returns

`any`

### Example

```ts
if (getLocale() === 'de') {
    console.log('Germany 🇩🇪');
  } else if (getLocale() === 'nl') {
    console.log('Netherlands 🇳🇱');
  }
```

***

## getUrlOrigin()

> **getUrlOrigin**(): `string`

Defined in: [runtime/get-url-origin.js:12](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-url-origin.js)

The origin of the current URL.

Defaults to "http://y.com" in non-browser environments. If this
behavior is not desired, the implementation can be overwritten
by `overwriteGetUrlOrigin()`.

### Returns

`string`

***

## isLocale()

> **isLocale**(`locale`): `locale is any`

Defined in: [runtime/is-locale.js:16](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/is-locale.js)

Check if something is an available locale.

### Parameters

#### locale

`any`

### Returns

`locale is any`

### Example

```ts
if (isLocale(params.locale)) {
    setLocale(params.locale);
  } else {
    setLocale('en');
  }
```

***

## localizeHref()

> **localizeHref**(`href`, `options`?): `string`

Defined in: [runtime/localize-href.js:43](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-href.js)

High-level URL localization function optimized for client-side UI usage.

This is a convenience wrapper around `localizeUrl()` that provides features
needed in UI:

- Accepts relative paths (e.g., "/about")
- Returns relative paths when possible
- Automatically detects current locale if not specified
- Handles string input/output instead of URL objects

### Parameters

#### href

`string`

The href to localize (can be relative or absolute)

#### options?

Options for localization

##### locale?

`string`

Target locale. If not provided, uses `getLocale()`

### Returns

`string`

The localized href, relative if input was relative

### Example

```typescript
// In a React/Vue/Svelte component
const NavLink = ({ href }) => {
  // Automatically uses current locale, keeps path relative
  return <a href={localizeHref(href)}>...</a>;
};

// Examples:
localizeHref("/about")
// => "/de/about" (if current locale is "de")
localizeHref("/store", { locale: "fr" })
// => "/fr/store" (explicit locale)

// Cross-origin links remain absolute
localizeHref("https://other-site.com/about")
// => "https://other-site.com/de/about"
```

For server-side URL localization (e.g., in middleware), use `localizeUrl()`
which provides more precise control over URL handling.

***

## localizeUrl()

> **localizeUrl**(`url`, `options`?): `URL`

Defined in: [runtime/localize-url.js:53](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-url.js)

Lower-level URL localization function, primarily used in server contexts.

This function is designed for server-side usage where you need precise control
over URL localization, such as in middleware or request handlers. It works with
URL objects and always returns absolute URLs.

For client-side UI components, use `localizeHref()` instead, which provides
a more convenient API with relative paths and automatic locale detection.

### Parameters

#### url

The URL to localize. If string, must be absolute.

`string` | `URL`

#### options?

Options for localization

##### locale?

`string`

Target locale. If not provided, uses getLocale()

### Returns

`URL`

The localized URL, always absolute

### Examples

```typescript
// Server middleware example
app.use((req, res, next) => {
  const url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
  const localized = localizeUrl(url, { locale: "de" });

  if (localized.href !== url.href) {
    return res.redirect(localized.href);
  }
  next();
});
```

```typescript
// Using with URL patterns
const url = new URL("https://example.com/about");
localizeUrl(url, { locale: "de" });
// => URL("https://example.com/de/about")

// Using with domain-based localization
const url = new URL("https://example.com/store");
localizeUrl(url, { locale: "de" });
// => URL("https://de.example.com/store")
```

***

## overwriteGetLocale()

> **overwriteGetLocale**(`fn`): `void`

Defined in: [runtime/get-locale.js:147](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-locale.js)

Overwrite the `getLocale()` function.

Use this function to overwrite how the locale is resolved. For example,
you can resolve the locale from the browser's preferred language,
a cookie, env variable, or a user's preference.

### Parameters

#### fn

() => `any`

### Returns

`void`

### Example

```ts
overwriteGetLocale(() => {
    // resolve the locale from a cookie. fallback to the base locale.
    return Cookies.get('locale') ?? baseLocale
  }
```

***

## overwriteGetUrlOrigin()

> **overwriteGetUrlOrigin**(`fn`): `void`

Defined in: [runtime/get-url-origin.js:29](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-url-origin.js)

Overwrite the getUrlOrigin function.

Use this function in server environments to
define how the URL origin is resolved.

### Parameters

#### fn

() => `string`

### Returns

`void`

***

## overwriteServerAsyncLocalStorage()

> **overwriteServerAsyncLocalStorage**(`value`): `void`

Defined in: [runtime/variables.js:77](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

Sets the server side async local storage.

The function is needed because the `runtime.js` file
must define the `serverAsyncLocalStorage` variable to
avoid a circular import between `runtime.js` and
`server.js` files.

### Parameters

#### value

`undefined` | [`ParaglideAsyncLocalStorage`](-internal-.md#paraglideasynclocalstorage)

### Returns

`void`

***

## overwriteSetLocale()

> **overwriteSetLocale**(`fn`): `void`

Defined in: [runtime/set-locale.js:119](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/set-locale.js)

Overwrite the `setLocale()` function.

Use this function to overwrite how the locale is set. For example,
modify a cookie, env variable, or a user's preference.

### Parameters

#### fn

(`newLocale`) => `void`

### Returns

`void`

### Example

```ts
overwriteSetLocale((newLocale) => {
    // set the locale in a cookie
    return Cookies.set('locale', newLocale)
  });
```

***

## setLocale()

> **setLocale**(`newLocale`, `options`?): `void`

Defined in: [runtime/set-locale.js:30](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/set-locale.js)

Set the locale.

Set locale reloads the site by default on the client. Reloading
can be disabled by passing `reload: false` as an option. If
reloading is disbaled, you need to ensure that the UI is updated
to reflect the new locale.

### Parameters

#### newLocale

`any`

#### options?

##### reload?

`boolean`

### Returns

`void`

### Examples

```ts
setLocale('en');
```

```ts
setLocale('en', { reload: false });
```

***

## trackMessageCall()

> **trackMessageCall**(`safeModuleId`, `locale`): `void`

Defined in: [runtime/track-message-call.js:7](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/track-message-call.js)

### Parameters

#### safeModuleId

`string`

#### locale

`any`

### Returns

`void`
