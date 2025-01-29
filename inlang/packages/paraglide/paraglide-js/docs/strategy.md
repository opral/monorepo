# Locale strategy

Write your own cookie, http header, or i18n routing based locale strategy to integrate Paraglide into any framework or app.

## Basics

Every time a message is rendered, Paraglide calls the `getLocale()` function under the hood to determine which locale to apply. By default, this will be the `baseLocale` defined in your settings. Calling `setLocale(locale)` anywhere in your code will update the locale stored by the runtime. Any calls to `getLocale()` after that (eg: when a new message is rendered) will return the newly set locale.

This behaviour is far too simple for most apps. Instead of starting with the default `baseLocale`, you will probably want to determine the locale based on cookies, a http header or a routing strategy. Likewise, if the locale is changed by the user, you might want to update some cookies, change the route, or trigger a rerender of the app.

Only two APIs are needed to define this behaviour and adapt Paraglide JS to your requirements: 

- `defineGetLocale` defines the `getLocale()` function that messages use to determine the locale
- `defineSetLocale` defines the `setLocale()` function that apps call to change the locale

Because the client and server have separate Paraglide runtimes, you will need to define these behaviours separately on the client and server. 

The steps are usually the same, irrespective of the strategy and framework you use:

1. Use `defineGetLocale()` function that reads the locale from a cookie, HTTP header, or i18n routing.
2. Handle any side effects of changing the locale and trigger a re-render in your application via `defineSetLocale()` (for many apps, this may only be required on the client side). 

_Read the [architecture documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/architecture) to learn more about's Paraglide's inner workings._

### Dynamically resolving the locale (cookies, http headers, i18n routing, etc.)

To dynamically resolve the locale, pass a function that returns the locale to `getLocale()`. You can use this to get the locale from the `documentElement.lang` attribute, a cookie, a locale route, or any other source.

```js
import * as m from "./paraglide/messages.js";
import { defineGetLocale } from "./paraglide/runtime.js";

defineGetLocale(() => document.documentElement.lang /** en */);

m.orange_dog_wheel(); // Hello world!
```

On the server, you might determine the locale from a cookie, a locale route, a http header, or anything else. When calling `defineGetLocale()` on the server, you need to be mindful of race conditions caused when multiple requests come in at the same time with different locales. 

To avoid this, use `AsyncLocaleStorage` in Node, or its equivalent for other server-side JS runtimes. 

```js
import * as m from "./paraglide/messages.js";
import {defineGetLocale, baseLocale } from "./paraglide/runtime.js";
import { AsyncLocalStorage } from "node:async_hooks";
const localeStorage = new AsyncLocalStorage();

defineGetLocale(() => {
  //any calls to getLocale() in the async local storage context will return the stored locale
  return localeStorage.getStore() ?? baseLocale;
});

export function onRequest(request, next) {
  const locale = detectLocale(request); //parse the locale from headers, cookies, etc.
  // set the async locale storage for the current request
  // to the detected locale and let the request continue
  // in that context 
  return localeStorage.run(locale, async () => await next());
}
```

Or, for a SvelteKit specific example, in your `hooks.server.ts`:

```js
import { AsyncLocalStorage } from 'node:async_hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { defineGetLocale, baseLocale } from './paraglide/runtime.js';

defineGetLocale(() => {
  //any calls to getLocale() in the async local storage context will return the stored locale
  return localeStorage.getStore() ?? baseLocale;
});

async function localeHandler({event, resolve}) {
  const locale = detectLocale(request);
  // set the async locale storage for the current request
  // to the detected locale and let the request continue
  // in that context
  return locale.run(locale, async() => await resolve(event));
}

async function mainHandler({event, resolve}) {
  //...your main server side request handler logic
  return await resolve(event);
}

export const handle = sequence(
  localeHandler, //goes first to set the locale context for the rest of the request
  mainHandler
);

```


### Trigger a re-render 

When the user changes the locale (eg: using a language switcher) you will likely want to trigger a re-render of your application. To do so, use the `defineSetLocale` callback. How to trigger a re-render depends on your application but usually involves setting a render key at the top level of your application. 

Below is an example for React.

```js
import { useState } from "react";
import * as m from "./paraglide/messages.js";
import { getLocale, defineSetLocale, setLocale } from "./paraglide/runtime.js";

function App() {
	const [localeRenderKey, setLocaleRenderKey] = useState(getLocale());

	defineGetLocale(() => {
		return document.documentElement.lang; //or any other source
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

For SvelteKit you can wrap your base `+layout.svelte` in a `{#key getLocale()}{/key}` block to automatically trigger a rerender whenever `setLocale()` is called: 
```svelte
<script lang="ts">
import * as m from "./paraglide/messages.js";
import { getLocale, defineGetLocale, defineSetLocale, setLocale } from "./paraglide/runtime.js";

//first set the locale
setLocale(document.documentElement.lang); //or any other source
let locale = $state(getLocale()); //stores the current locale

defineGetLocale(() => {
	return locale;
});

defineSetLocale((newLocale) => {
	locale = newLocale;
	//update any cookies, localStorage, etc
});
</script>
{#key getLocale()}
	<div>
		<button onClick={() => setLocale("en")}>Switch locale to en</button>
		<button onClick={() => setLocale("de")}>Switch locale to de</button>
		<button onClick={() => setLocale("fr")}>Switch locale to fr</button>
		<p>{m.orange_dog_wheel()}</p>
	</div>
	<div>
		<!--The rest of your application-->
		{@render children()}
	</div>
{/key}
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
