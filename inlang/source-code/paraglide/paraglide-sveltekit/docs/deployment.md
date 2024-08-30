# Deployment

Deploying a SvelteKit App using `Paraglide-Sveltekit` is usually no different than deploying a normal SvelteKit App.

However, there are some considerations you may want to take with certain hosting providers.

## Serverless Providers

`Paraglide-SvelteKit` makes use of `AsyncLocalStorage` to keep track of the language on the server without introducing cross-talk between concurrent requests.

Serverless providers usually spawn an instance of the server for _each_ request, so this isn't necessary. To improve performance you can disable it.

```ts
// src/hooks.server.js
import { i18n } from "$lib/i18n"

export const handle = i18n.handle({
	disableAsyncLocalStorage: true, // @default = false
})
```

## Deployment on Cloudflare

`Paraglide-SvelteKit` makes use of `AsyncLocalStorage`. `AsyncLocalStorage` is supported on Cloudflare, but you need to enable the `nodejs_compat` feature flag in `wrangler.toml`.

```toml
compatibility_flags = [ "nodejs_compat" ]
```

## Issues on Vercel

SvelteKit's `reroute` hook currently doens't play well with Vercel (see [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879)), which means that we need to slightly adapt the setup to make it work when deployed to Vercel.

1. Remove the `reroute` hook from `src/hooks.js`
2. Move the routes you want to localize `routes` into a `[[locale]]` folder
3. Don't use translated `pathnames`

We are working on contributing a fix for [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879), so this workaround will hopefully not be needed much longer.
