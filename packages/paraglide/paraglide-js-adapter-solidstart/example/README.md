# Paraglide Example with [SolidStart](https://start.solidjs.com)

This Example aims to demonstrate the minimal setup required to get started with Paraglide and SolidStart.

To see a slightly more complex example, check out the [hackernews clone built with SolidStart and Paraglide-js](https://github.com/thetarnav/paraglide-solidstart-hackernews).

**Project structure explained:**

```bash
node_modules/
    @inlang/paraglide-js/ # paraglide compiler
    @inlang/paraglide-js-adapter-solidstart/ # solidstart adapter
    @inlang/paraglide-js-adapter-vite # optional vite plugin that makes the integration easier
src/
    paraglide/ # compiled output of paraglide
        messages.js # all message functions for use in you app
        runtime.js # runtime used by the adapter
    i18n/
        en.json # english messages
        de.json # german messages
        index.tsx # your i18n module, this is where the adapter is used to wrap paraglide and provide an api to use for your app
    routes/... # each route will have /en/path and /de/path variants automatically generated
    app.tsx # read the current locale is read from the URL, and provide to the entire app
    entry-server.tsx # set html lang attribute, and alternate links for each language
vite.config.ts # paraglide vite plugin will compile the paraglide files when you run the dev server
```
