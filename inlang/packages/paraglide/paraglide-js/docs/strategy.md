# Locale strategy

Write your own cookie, http header, or i18n routing based locale strategy.

## Basics

Only two APIs are needed to adapt Paraglide JS to your requirements: 

- `defineGetLocale` defines the `getLocale()` function that messages use to determine the locale
- `defineSetLocale` defines the `setLocale()` function that apps call to change the locale

The steps are usually the same, irrespective of the strategy and framework you use:

1. Use `defineGetLocale()` function that reads the locale from a cookie, HTTP header, or i18n routing.
2. Trigger a re-render in your application via `defineSetLocale()`. 

_Read the [architecture documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/architecture) to learn more about's Paraglide's inner workings._

### Dynamically resolving the locale (cookies, http headers, i18n routing, etc.)

Do dynamically set the locale, pass a function that returns the locale to `setLocale`. You can use this to get the locale from the `documentElement.lang` attribute, a cookie, a HTTP header, or any other source.

```js
import * as m from "./paraglide/messages.js";
import { setLocale } from "./paraglide/runtime.js";

defineSetLocale(() => document.documentElement.lang /** en */);

m.greeting(); // Hello world!
```

### Trigger a re-render 

To trigger a re-render in your application, use the `defineSetLocale` callback. How to trigger a re-render depends on your application but usually involves setting a render key at the top level of your application. 

Below is an example for React.

```js
import { useState } from "react";
import * as m from "./paraglide/messages.js";
import { getLocale, defineSetLocale, setLocale } from "./paraglide/runtime.js";

function App() {
	const [localeRenderKey, setLocaleRenderKey] = useState(getLocale());

	defineGetLocale(() => {
		return document.documentElement.lang;
	})

	defineSetLocale((newLocale) => {
		setLocaleRenderKey(newLocale);
	});

	return (
		// The render key will trigger a re-render when the locale changes
		<div key={localeRenderKey}>
			<button onClick={() => setLocale("en")}>Switch locale to en</button>
			<button onClick={() => setLocale("de")}>Switch locale to de</button>
			<button onClick={() => setLocale("fr")}>Switch locale to fr</button>
			<p>{m.orange_dog_wheel()}</p>
		</div>
	);
}
```

## Examples

### Cookie based strategy

The example uses React for demonstration purposes. You can replicate the same pattern in any other framework or vanilla JS.

1. Define the `getLocale()` function that reads the locale from a cookie.
2. Define the `setLocale()` function that writes the locale to a cookie and triggers a re-render.

```tsx
import * as m from "./paraglide/messages.js";
import { defineSetLocale, defineGetLocale, setLocale, baseLocale } from "./paraglide/runtime.js";
import { useState } from "react";

function App() {
	const [localeRenderKey, setLocaleRenderKey] = useState(null);

	defineGetLocale(() => {
		return Cookies.get("locale") ?? baseLocale;
	});

	defineSetLocale((newLocale) => {
		// set the locale in the cookie
		Cookies.set("locale", newLocale);
		// trigger a re-render
		setLocaleRenderKey(newLocale);
	});

	return (
		// The render key will trigger a re-render when the locale changes
		<div key={localeRenderKey}>
			<button onClick={() => setLocale("en")}>Switch locale to en</button>
			<button onClick={() => setLocale("de")}>Switch locale to de</button>
			<button onClick={() => setLocale("fr")}>Switch locale to fr</button>
			<p>{m.orange_dog_wheel()}</p>
		</div>
	);
}
```

### Server-side rendering

1. Detect the locale from the request. 
2. Make sure that `defineGetLocale()` is cross-request safe on the server. 

Pseudocode logic on the server: 

```ts
import { defineGetLocale, defineSetLocale, setLocale, baseLocale } from "./paraglide/runtime.js";
import { AsyncLocalStorage } from "node:async_hooks";

const localeStorage = new AsyncLocalStorage();

// ✅ DO THIS
// ✅ when `getLocale()` is called inside a route handler
// ✅ this function will return the language for the current request
defineGetLocale(() => {
  return localeStorage.getValue() ?? baseLocale;
});

export function onRequest(request, next) {
  const locale = detectLocale(request);
	// set the async locale storage for the current request
	// to the detected locale and let the request continue
	// in the async context 
  return localeStorage(locale, async () => await next());
}
```

Pseudocode on the client:

```ts
function App() {
  if (!import.meta.env.SSR){
		defineGetLocale(() => {
			// your strategy to detect the locale on the client
	  });
		defineSetLocale((newLocale) => {
			// your strategy
		});
	} 

	return (
		<div>
			<p>{m.orange_dog_wheel()}</p>
		</div>
	);
}
```