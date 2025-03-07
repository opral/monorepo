# Errors

## No locale found

Paraglide JS was not able to resolve a locale. This can happen if: 

1. Your strategy array is empty.

```diff
-strategy: []
+strategy: ["cookie", "baseLocale"]
```

2. You are using `overwriteGetLocale()` and `overwriteSetLocale()` but forgot to call them at the root/entrypoint of your app.

If you use an empty strategy array `[]`, and overwrite the locale getter and setter, make sure to call `overwriteGetLocale()` and `overwriteSetLocale()` at the root/entrypoint of your app.

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

app.use(paraglideMiddleware)

// ✅ this will work
app.get("/", (req, res) => {
	console.log(m.hello());
});
```