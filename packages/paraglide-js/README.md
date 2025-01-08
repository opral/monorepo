[![Inlang-ecosystem compatibility badge](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/assets/md-badges/inlang.svg)](https://inlang.com)

# Getting started

To auto setup Paraglide JS, run the following command:

```bash
npx @inlang/paraglide-js@latest init
```

This will:

- Create an [inlang project](https://inlang.com/documentation/concept/project)
- Install necessary dependencies
- Generate a `messages/` folder where your translation files live

## Adding and editing Messages

Messages are stored in `messages/{locale}.json` as key-value pairs. You can add parameters with curly braces.

```diff
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
+ 	"greeting": "Hello {name}!"
}
```

Run the compiler via the CLI to generate the message functions.

```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
```

_If you are using a Bundler use one of the [Bundler Plugins](usage#usage-with-a-bundler) to recompile automatically._

## Using messages in code

After running the compiler import the messages with `import * as m from "./paraglide/messages"`. By convention, a wildcard import is used.

```js
import * as m from "./paraglide/messages.js";

m.greeting({ name: "Samuel" }); // Hello Samuel!
```

## Managing the locale

1. Set the locale with `setLocale` to render messages in a specific language.
2. Trigger a re-render in your application. 

### Setting the locale

Call `setLocale` to set the locale a message should be rendered in. 

```js
import * as m from "./paraglide/messages.js";
import { setLocale } from "./paraglide/runtime.js";

setLocale("de");
m.hello(); // Hallo Welt!

setLocale("en");
m.hello(); // Hello world!
```

### Dynamically setting the locale (cookies, http headers, i18n routing, etc.)

Do dynamically set the locale, pass a function that returns the locale to `setLocale`. You can use this to get the locale from the `documentElement.lang` attribute, a cookie, a HTTP header, or any other source.

```js
import * as m from "./paraglide/messages.js";
import { setLocale } from "./paraglide/runtime.js";

setLocale(() => document.documentElement.lang /** en */);

m.hello(); // Hello world!
```

### Trigger a re-render 

To trigger a re-render in your application, use the `onSetLocale` callback. How to trigger a re-render depends on your application but usually involves setting a render key at the top level of your application. 

Below is an example for React.

```js
import { useState } from "react";
import * as m from "./paraglide/messages.js";
import { getLocale, onSetLocale, setLocale } from "./paraglide/runtime.js";

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

