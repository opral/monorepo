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

## Changing the locale 

To change the locale, use the `setLocale` function. 

```js
import { setLocale } from "./paraglide/runtime.js";
import * as m from "./paraglide/messages.js";

m.greeting({ name: "Samuel" }); // Hello Samuel!

setLocale("de");

m.greeting({ name: "Samuel" }); // Guten Tag Samuel!
```

## Define your strategy 

In the last step, you need to define what strategy you want to use to resolve the locale. Visit the [strategy documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy) to learn more.