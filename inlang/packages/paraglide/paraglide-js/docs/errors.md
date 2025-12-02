# Errors

## No locale found

Paraglide JS was not able to resolve a locale. This can happen if:

1. Your strategy array is empty.

```diff
-strategy: []
+strategy: ["cookie", "baseLocale"]
```

2. You are using `overwriteGetLocale()` and `overwriteSetLocale()` but forgot to call them at the root/entrypoint of your app.

```tsx
import { overwriteGetLocale, overwriteSetLocale } from "./paraglide/runtime.js";

// Call the overwrites before your app starts rendering.
overwriteGetLocale(() => "en");
overwriteSetLocale((locale) => console.log(`Set locale to ${locale}`));

// Your app rendering entrypoint.
export default function App() {
	return (
		<div>
			<p>Hello world</p>
		</div>
	);
}
```

3. You are using the `url` strategy but call messages outside of a request context.

```
strategy: ["url"]
```

```tsx
// hello.ts
import { m } from "./paraglide/messages.js";

// 💥 there is no url in this context to retrieve
//    the locale from.
console.log(m.hello());
```

Make sure to call messages within a request context that is set by the paraglideMiddleware:

<doc-callout type="info">
  Dependent on your framework, what runs in a request context can differ. In SvelteKit, for example, you can use the `load` function in your routes to ensure that messages are called within a request context.
</doc-callout>

```tsx
// hello.ts
import { m } from "./paraglide/messages.js";

app.use(paraglideMiddleware);

// ✅ this will work
app.get("/", (req, res) => {
	console.log(m.hello());
});
```

4. You make API requests and only have `strategy: ["url"]` set.

Paraglide JS will only extract the locale from a URL if the request is a document request, indicated by [Sec-Fetch-Dest: document](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Dest) to distinguish it from API requests.

Add `cookie` or `baseLocale` to your strategy array to ensure that the locale is always resolved in API requests as well.

```diff
-strategy: ["url"]
+strategy: ["url", "cookie", "baseLocale"]
```

## Switching locales via links doesn't work

Use `setLocale()` to switch locales.

If your application uses client-side routing, the UI will not update if you use a localized href to switch the locale. You need to force a reload or navigate to the new locale.

Issue [#472](https://github.com/opral/inlang-paraglide-js/issues/472) discusses possibilities to handle this in a framework-agnostic way.

```tsx
import { setLocale } from "./paraglide/runtime.js";

// ✅ this will work
setLocale("de");

// ❌ this will not work in client side routing
<a href={localizeHref("/page", { locale: "de" })}>Deutsch</a>

// 🟠 your framework might expose a reload attribute which 
//    would make locale switching via links work
<a
  href={localizeHref("/page", { locale: "de" })}
  reload={true}
>Deutsch</a>
```

## TS does not autocomplete messages and shows errors 

> Property 'some_message_key' does not exist on type 'typeof import("/path/to/your/repo/src/lib/paraglide/messages/_index")'

TS does not pick up the new message keys, after the TS language server started. Try using the `emitTsDeclarations` flag, to emit a `messages.d.ts` declaration file for your Typescript intellisense to grab. It will update on each paraglide compilation.

```diff
// project.inlang/settings.json
{
  // ...
+  "emitTsDeclarations": true
}
```