# Paraglide Adapter SvelteKit
Everything you need to internationalize your SvelteKit app with Paraglide.

Paraglide Adapter SvelteKit takes care of:
- Internationalized routing
- Rewriting links to the correct language
- Internationalized SEO


## Installation
```bash
npm i -D @inlang/paraglide-js-adapter-sveltekit
```

Then add the adapter to your `vite.config.js` file:

```js
import { paraglide } from '@inlang/paraglide-js-adapter-sveltekit'

export default defineConfig({
    plugins: [
        paraglide({
            // options
        }),
        sveltekit()
    ]
})
```

And you're done! 🎉
