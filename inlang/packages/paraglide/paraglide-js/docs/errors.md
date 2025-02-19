# Errors

## No locale found

Your strategy array is likely empty or the locale you are trying to use is not in the strategy array. Please check your configuration.

```diff
-strategy: []
+strategy: ["cookie", "baseLocale"]
```

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
