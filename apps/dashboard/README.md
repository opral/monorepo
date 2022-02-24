# @inlang/dashboard 

## Running locally
Open the root of this repository ([/](https://github.com/inlang/inlang)) and follow the instructions there.

## Get eslint warnings

See [this](https://github.com/sveltejs/eslint-plugin-svelte3/blob/master/INTEGRATIONS.md) as of October 2021:

1. Open the `settings.json` file from VSCode (eslint)
2. Add

```JSON
"eslint.validate": [
    "javascript",
    "javascriptreact",
    "svelte"
  ]
```

## Structure of the app

The app is developed with [SvelteKit](https://kit.svelte.dev/), [CarbonComponents](https://carbon-svelte.vercel.app/) and [TailwindCSS](https://tailwindcss.com/).
Most questions should be answered by reading the documentation of either one of them.
