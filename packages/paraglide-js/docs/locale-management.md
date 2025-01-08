# Locale Management

Write your own cookie, http header, or i18n routing based locale management with this guide. 

## Basics

Only three APIs are needed to adapt Paraglide JS to your locale management requirements: 

- `setLocale` is setting a getter function that returns the locale messages should be rendered in
- `getLocale` is a global function that returns the current locale
- `onSetLocale` is a callback that is called whenever the locale changes

![Diagram of the Paraglide Compiler Architecture](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide-js/assets/architecture.svg)

_For more information about Paraglide's architecture, read the [architecture documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/architecture)._

## Example cookie based locale management

The example uses React for demonstration purposes. You can replicate the same pattern in any other framework or vanilla JS.

```tsx
import * as m from "./paraglide/messages.js";
import { getLocale, onSetLocale, setLocale, baseLocale } from "./paraglide/runtime.js";
import { useState } from "react";

setLocale(() => {
  return Cookies.get("locale") ?? baseLocale;
})

function App() {
	const [localeRenderKey, setLocaleRenderKey] = useState(getLocale());

	onSetLocale((newLocale) => {
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





## `setLocale()` on the server

The `getLocale()` function is global. This means that on the server it is _shared_ accross requests. In order to avoid the locale from one request being overwritten by another request you need to use _getter function_ that returns the language for the _current request_. A good way to implement this is using [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html).

**⛔️ Bad Example**:

```ts
import { setLocale, sourceLanguageTag } from "./paraglide/runtime.js";

export function onRequest(request, next) {
  const langForReq = detectLanguage(request);

  // ⛔️ DONT DO THIS
  // ⛔️ If multiple requests are handled concurretntly
  // ⛔️ later ones will override the language for earlier ones
  setLocale(langForReq);

  return langStorage(langForReq, async () => await next());
}
```

**✅ Good Example**:

```ts
import { setLocale, sourceLanguageTag } from "./paraglide/runtime.js";
import { AsyncLocalStorage } from "node:async_hooks";

const langStorage = new AsyncLocalStorage();

// ✅ DO THIS
// ✅ when `locale` is called inside a route handler
// ✅ this function will return the language for the current request
setLocale(() => {
  return langStorage.getValue() ?? sourceLanguageTag;
});

export function onRequest(request, next) {
  const langForReq = detectLanguage(request);
  return langStorage(langForReq, async () => await next());
}
```