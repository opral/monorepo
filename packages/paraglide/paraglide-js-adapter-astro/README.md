# Paraglide Adapter Astro

This package provides an Astro Integration for Paraglide. It automatically sets the language based on the URL, and manages the language for you.

## Installation

```bash
npx @inlang/paraglide-js init
npm i -D @inlang/paraglide-js-adapter-astro
```

Then register the Integration in your `astro.config.mjs`:

```js
import { paraglide } from '@inlang/paraglide-js-adapter-astro'

export default {
  integrations: [
    //this will automatically set the language based on the URL
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
  ],
}
```

## Usage


### Setting up an Alias for Convenience

You will be importing from the generated `paraglide` folder a lot. To make this easier, you can set up an alias to it in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "$paraglide/*": ["./src/paraglide/*"]
    }
  }
}
```

Make sure `baseUrl` is also set.

This will allow you to import messages like so: 
    
```astro
---
import * as m from "$paraglide/messages.js";
---

<h1>{m.hello_world()}</h1>
```

### Usage the Client

To save bundle size on the client, the integration doesn't ship language detection code to the client. Instead, it will read the `lang` attribute on the `<html>` tag & trust that. Make sure it is set correctly when rendering on the server / statically.

```astro
---
import { languageTag } from "$paraglide/runtime";
---

<!doctype html>
<html lang={languageTag()}>
    <slot />
</html>
```