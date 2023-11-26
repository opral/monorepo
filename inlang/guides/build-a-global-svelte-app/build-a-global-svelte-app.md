# Build a global [SvelteKit](https://kit.svelte.com) app

In this guide we will use [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) and [inlang's IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

Translated string(s) in this guide might be referred to as message(s) or translation(s).

## 1. Starting point

Start with a basic SvelteKit app with `npm create`:
```cmd
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
git init
```

## 2. Initialize Paraglide

The CLI might ask you some questions. To improve your experience, answer them thoroughly.

```cmd
npx @inlang/paraglide-js@latest init

✔ Successfully created a new inlang project.                                                                              
✔ Added @inlang/paraglide-js to the dependencies in package.json.                                                               
✔ Successfully added the compile command to the build step in package.json.                                                       

 ╭──────────────────────────────────────────────────────────────────────────────────────╮
 │                                                                                      │
 │  inlang Paraglide-JS has been set up sucessfully.                                    │
 │                                                                                      │
 │  1. Run your install command (npm i, yarn install, etc)                              │
 │  2. Run the build script (npm run build, or similar.)                                │
 │  3. Done :) Happy paragliding 🪂                                                     │
 │                                                                                      │
 │   For questions and feedback, visit https://github.com/inlang/monorepo/discussions.  │
 │                                                                                      │
 │                                                                                      │
 ╰──────────────────────────────────────────────────────────────────────────────────────╯
```

## 3. Set up SvelteKit workspace for Paraglide

We need to install some packages and change some files, for Paraglide and SvelteKit to work together.

```cmd
npm install @inlang/paraglide-js-adapter-vite
```

### Vite.config.ts

We import the vite adapter for paraglide, and reference the project file.
The `outdir` is the default outdir, in case you change it, please update it in the following `svelte.config.js` too. 

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { paraglide } from "@inlang/paraglide-js-adapter-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
	// ...
    sveltekit(),
    paraglide({
      project: "./project.inlang.json",
      outdir: "./src/paraglide",
    }),
  ],
  // for easier debugging, you might not want to minify
  // build: {
  // 	minify: false,
  // },
});
```

### Svelte.config.js

With this we can access the `paraglide` folder easier from anywhere in the project, using `$paraglide/*`

```js
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),

    // with this we will be able to access paraglide easier.
    alias: {
      $paraglide: "./src/paraglide",
    },
  },
};

export default config;

```

### Adding an Adapter

We also need to add an adapter for SvelteKit. This ensures routing and the dev server works correctly.

The features of the provided router:
- example.com/page -> loads the page in source language
- example.com/de/page -> loads the page in given language
- example.com/xxx/page -> if the given language does not exist, it redirects to the source language.

Here is the actual adapter (`src/lib/ParaglideSvelteKit.svelte`), you can read the comments for what each part of the code does:

```ts
<script lang="ts">
  import {
    availableLanguageTags,
    setLanguageTag,
    onSetLanguageTag,
    sourceLanguageTag,
    languageTag,
  } from "../paraglide/runtime";
  import { getContext, onMount, setContext } from "svelte";
  import { page } from "$app/stores";
  import { redirect } from "@sveltejs/kit";

  // We check if the language tag is valid, if it is, we set it,
  // if not, we redirect to the same page without the language tag
  setContext(
    "languageTag",
    $page.params.lang
      ? (availableLanguageTags as readonly string[]).includes($page.params.lang)
        ? $page.params.lang
        : (() => {
            throw redirect(
              302,
              ("/" + $page.url.href.split($page.params.lang)[1]).replace(
                "//",
                "/"
              )
            );
          })()
      : sourceLanguageTag
  );

  setLanguageTag(() => getContext("languageTag"));

  // We save the old language tag to check if the language tag has changed
  let oldLanguageTag = languageTag();

  if (import.meta.env.SSR === false) {
    onSetLanguageTag((newLanguageTag) => {
      // If the language tag is the same as the current language tag, we don't want to do anything
      if (newLanguageTag === oldLanguageTag) return;

      // If we set the language tag to the source language tag, we want to remove the language tag from the url
      if (newLanguageTag === sourceLanguageTag) {
        // this returns the route without the language tag
        const route = window.location.href.match(
          /^https?:\/\/[^\/]+\/[^\/]*(\/.*)/
        );

        // Redirect to the same page with the new language
        window.location.href = route ? route[1] : "/";

        // renew the old language tag
        oldLanguageTag = newLanguageTag;

        // if we set the language tag from the source language tag, we want to add the language tag to the url
      } else if (oldLanguageTag === sourceLanguageTag) {
        // this simply returns the route, since we don't have to remove the language tag,
        // beacuse the preveous language was the source language.
        // It also does not matter if for some reason "en" language tag is still given, it removes it anyway.
        const route = window.location.href
          .replace(/^https?:\/\/[^\/]+\/(en)(\/|$)/, "")
          .match(/^https?:\/\/[^\/]+(\/.*)/);

        // Redirect to the same page with the new language
        window.location.href = route
          ? "/" + newLanguageTag + route[1]
          : "/" + newLanguageTag;

        // renew the old language tag
        oldLanguageTag = newLanguageTag;

        // if we change the language tag not from and not to the source language, we want to keep the url
      } else {
        // this returns the route without the language tag
        const route = window.location.href.match(
          /^https?:\/\/[^\/]+\/[^\/]*(\/.*)/
        );

        // Redirect to the same page with the new language
        window.location.href =
          route && route[1]
            ? "/" + newLanguageTag + route[1]
            : "/" + newLanguageTag;

        // renew the old language tag
        oldLanguageTag = newLanguageTag;
      }
    });
  }
</script>

<slot />
```

Now we can import the router for the application to work properly. For that, we need to edit `src/routes/+layout.svelte`:

```ts
<script lang="ts">
  import "../app.css";
  import ParaglideJsSvelteKitAdapter from "$lib/ParaglideSvelteKit.svelte";
</script>

<ParaglideJsSvelteKitAdapter>
  <slot />
</ParaglideJsSvelteKitAdapter>
```

The adapter is also made to work in a specific way. It uses a routing feature of SvelteKit called [slugs](https://kit.svelte.dev/docs/routing) to store the language in the URL. It basically allows us to get the parameter, and reactively update the page according to the value.

In order to take advante of this feature, the structure of the routes should be the following:

```cmd
routes
├── +layout.svelte
└── [[lang]]              // double brackets makes it optional, /page and /de/page are both valid
    ├── +page.svelte      // homepage
    └── another-page
        └── +page.svelte  // another page
```

Every new route and subroutes should go under the [[lang]] folder.

## 4. Start working with Paraglide

Now we need to prepare our projects to accept translations.

### Prepare pages for translations

We need to import a few things in pages before we can use translations. You need to place the following code into every page you want to translate

```ts
<script lang="ts">
  import { setLanguageTag, languageTag } from "$paraglide/runtime"; // these two helps setting and getting the current language tag
  import * as m from "$paraglide/messages"; // this contains the translations

  // This function helps you make hrefs for <a> tags for example, to lead to the translated page.
  function redirectHref(href: string) {
    return languageTag() ? `/${languageTag()}${href}` : href;
  }
</script>
```
Now you can proceed with adding messages.

The default path for translation files are in the `./messages` directory. You can change this option in `project.inlang.json`. Here are the two ways you can add translations:


### Add messages through ide extension (recommended)

- Install the ide extension from the vs-code marketplace. 
[See extension on inlang.com](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
[vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

- Reload window (only needed once).
`⌘ or Ctrl` + `Shift` + `P` -> Developer: Reload Window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.

- Select a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` -> Inlang: Extract 
message. Give the message an ID and hit enter.

- This command extracts the hard-coded string and places it into the source language translation file `en.json` in the `messages` directory.

- Compile translation `npx paraglide-js compile --project ./project.inlang.json`


### Add messages manually

- Go to the `messages` directory and create a `en.json` file in it. (Make sure the naming is according to the [BCP-47](https://en.wikipedia.org/wiki/IETF_language_tag) language tags in the `project.inlang.json`)

- Add a message in the file.
```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"Welcome": "Welcome",
	"AnotherPage": "Another page"
}
```


- Compile translation `npx paraglide-js compile --project ./project.inlang.json`


## 5. See Paraglide JS in action

Let's use Paraglide to display messages in the frontend.

```ts
<script lang="ts">
  import { setLanguageTag, languageTag } from "$paraglide/runtime";
  import * as m from "$paraglide/messages";
</script>

// display the message
<p>{m.Welcome()}</p>
```

Let's change the language.

Create a second translation, for example, `de.json`

```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"Welcome": "Willkommen",
	"AnotherPage": "Eine andere Seite"
}
```

Let's also add buttons to change the language.

```ts
<script lang="ts">
  import { setLanguageTag, languageTag } from "$paraglide/runtime";
  import * as m from "$paraglide/messages";
</script>

<p>{m.Welcome()}</p>

// These will change the language on click
<button on:click={() => setLanguageTag("de")}>🇩🇪</button>
<button on:click={() => setLanguageTag("en")}>🇺🇸</button>

```

Now you can click each button and hopefully see the translation change.

Let's make the the links change based on the language tags.

```ts
<script lang="ts">
  import { setLanguageTag, languageTag } from "$paraglide/runtime";
  import * as m from "$paraglide/messages";

  function redirectHref(href: string) {
    return languageTag() ? `/${languageTag()}${href}` : href;
  }
</script>

<p>{m.Welcome()}</p>

<button on:click={() => setLanguageTag("de")}>🇩🇪</button>
<button on:click={() => setLanguageTag("en")}>🇺🇸</button>

// if the language is /de, it should redirect to /de/another-page (which probbably doesn't exist, but you get the point.)
<a href={redirectHref("/another-page")}>{m.AnotherPage()}</a>

```

You are ready to use Paraglide!

This guide is based on `paraglide-js 1.0.0-prerelease.11`, `plugin-message-format 2.0.0`, `m-function-matcher 0.5.0.` and `paraglide-js-adapter-vite 1.0.0-prerelease.1`
If you have problems, file an [issue]() or ask on [Discord]().
