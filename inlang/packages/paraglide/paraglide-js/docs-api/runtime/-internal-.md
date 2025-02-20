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

## strategy

> `const` **strategy**: (`"cookie"` \| `"baseLocale"` \| `"globalVariable"` \| `"url"`)[]

Defined in: [runtime/variables.js:27](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

***

## urlPatterns

> `const` **urlPatterns**: `object`[] = `[]`

Defined in: [runtime/variables.js:34](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/variables.js)

The used URL patterns.

### Type declaration

#### deLocalizedNamedGroups

> **deLocalizedNamedGroups**: `Record`\<`string`, `null` \| `string`\>

#### localizedNamedGroups

> **localizedNamedGroups**: `Record`\<`string`, `Record`\<`string`, `null` \| `string`\>\>

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

Defined in: [runtime/localize-href.js:64](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-href.js)

De-localizes an href.

In contrast to `deLocalizeUrl()`, this function automatically
calls `getLocale()` to determine the base locale and
returns a relative path if appropriate.

### Parameters

#### href

`string`

### Returns

`string`

- The de-localized href.

### Example

```ts
deLocalizeHref("/de/about")
  // => "/about"

  // requires full URL and locale
  deLocalizeUrl("http://example.com/de/about")
  // => "http://example.com/about"
```

***

## deLocalizeUrl()

> **deLocalizeUrl**(`url`): `URL`

Defined in: [runtime/localize-url.js:42](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-url.js)

### Parameters

#### url

`string` | `URL`

### Returns

`URL`

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

Defined in: [runtime/extract-locale-from-request.js:24](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/extract-locale-from-request.js)

Extracts a locale from a request.

Use the function on the server to extract the locale
from a request.

The function goes through the strategies in the order
they are defined.

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

Defined in: [runtime/extract-locale-from-url.js:11](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/extract-locale-from-url.js)

Extracts the locale from a given URL using native URLPattern.

### Parameters

#### url

`string`

The full URL from which to extract the locale.

### Returns

`any`

The extracted locale, or undefined if no locale is found.

***

## getLocale()

> **getLocale**(): `any`

Defined in: [runtime/get-locale.js:35](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-locale.js)

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

Defined in: [runtime/get-url-origin.js:10](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-url-origin.js)

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

Defined in: [runtime/localize-href.js:24](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-href.js)

Localizes an href.

In contrast to `localizeUrl()`, this function automatically
calls `getLocale()` to determine the target locale and
returns a relative path if appropriate.

### Parameters

#### href

`string`

#### options?

Options

##### locale?

`string`

The target locale.

### Returns

`string`

### Example

```ts
localizeHref("/about")
  // => "/de/about"

  // requires full URL and locale
  localizeUrl("http://example.com/about", { locale: "de" })
  // => "http://example.com/de/about"
```

***

## localizeUrl()

> **localizeUrl**(`url`, `options`): `URL`

Defined in: [runtime/localize-url.js:10](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/localize-url.js)

Localizes a URL to a specific locale using the new namedGroups API.

### Parameters

#### url

The URL to localize.

`string` | `URL`

#### options

Options containing the target locale.

##### locale

`string`

The target locale.

### Returns

`URL`

- The localized URL.

***

## overwriteGetLocale()

> **overwriteGetLocale**(`fn`): `void`

Defined in: [runtime/get-locale.js:83](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-locale.js)

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

Defined in: [runtime/get-url-origin.js:24](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/get-url-origin.js)

Overwrite the getUrlOrigin function.

Use this function in server environments to
define how the URL origin is resolved.

### Parameters

#### fn

() => `string`

### Returns

`void`

***

## overwriteSetLocale()

> **overwriteSetLocale**(`fn`): `void`

Defined in: [runtime/set-locale.js:83](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/set-locale.js)

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

> **setLocale**(`newLocale`): `void`

Defined in: [runtime/set-locale.js:18](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/src/compiler/runtime/set-locale.js)

Set the locale.

### Parameters

#### newLocale

`any`

### Returns

`void`

### Example

```ts
setLocale('en');
```
