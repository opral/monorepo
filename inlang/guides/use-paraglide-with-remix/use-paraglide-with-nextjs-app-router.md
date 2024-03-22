# Using ParaglideJS with Remix

In this guide you will lean how to add internationalised routing to your Remix App. We will use [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) to manage our messages and the [Remix-paraglideJS](https://github.com/BRIKEV/remix-paraglidejs) for internationalised routing.

Paraglide is a great fit for the Remix App because it uses a compiler to generate tree-shakeable messages. That way your client bundle only includes the messages that are used in client components on any given page.

This guide assumes that you have a Remix project set up. If you don't, you can follow the [Remix Getting Started Guide](https://remix.run/docs/en/main/other-api/create-remix).

## Installing dependencies

The recommended way to install ParaglideJS is via the cli. This will create any files that are required for Paraglide.js to work and install the required dependencies.

In your project root, run the following commands and follow the instructions.

```bash
npx @inlang/paraglide-js init
npm i --save remix-paraglidejs @inlang/paraglide-js-adapter-vite
```

This will have done a few things:

- Created an inlang project in your project root
- Added the required devDependencies to your `package.json`
- Installed the remix-paraglidejs


## Setting Up

In your `vite.config.ts`, import the `@inlang/paraglide-js-adapter-vite` and apply it to your config.

You will need to pass it some config. The location of the Inlang Project & the output directory that messages should be compiled to. You should stick with the defaults unless you have a reason not to.

```js
import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
/* --- INCLUDE THIS --- */
import { paraglide } from "@inlang/paraglide-js-adapter-vite";
/* ----------------- */

installGlobals();

export default defineConfig({
  plugins: [
    remix(),
    tsconfigPaths(),
    /* --- INCLUDE THIS --- */
    paraglide({
      project: "./project.inlang", //Path to your inlang project 
      outdir: "./paraglide", //Where you want the generated files to be placed
    }),
    /* ----------------- */
  ],
});
```

This Plugin will make sure to automatically recompile messages whenever they change.

Next, modify the Remix entry files [entry.client.tsx](https://remix.run/docs/en/main/file-conventions/entry.client) and [entry.server.tsx](https://remix.run/docs/en/main/file-conventions/entry.server). If you don't see these files, use `npx remix reveal`.

```js
// entry.client.tsx
import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
/* --- INCLUDE THIS --- */
import { hydrateLang } from 'remix-paraglidejs/client';
import { availableLanguageTags, setLanguageTag } from "<YOUR_PARAGLIDE_DIR>/runtime";
/* ----------------- */

startTransition(() => {
  /* --- INCLUDE THIS --- */
  const lang = hydrateLang('language-tag', availableLanguageTags);
  setLanguageTag(lang);
  /* ----------------- */
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
```

```tsx
// entry.server.tsx
import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import {
  createReadableStreamFromReadable,
/* --- INCLUDE THIS --- */
  createCookie,
} from "@remix-run/node";
import { setLangServerCookie, getContextLang } from 'remix-paraglidejs/server';
import { setLanguageTag, availableLanguageTags } from "<YOUR_PARAGLIDE_DIR>/runtime";

// language-tag value the same as the one in the entry.client.tsx
export const setLangCookie = createCookie("language-tag", {});
/* ----------------- */

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    /* --- INCLUDE THIS --- */
    const lang = getContextLang(remixContext, {
      defaultValue: availableLanguageTags[0],
      availableLanguages: availableLanguageTags,
      // The URL parameter to look for when determining the language
      // for example ($lang)._index.tsx
      urlParam: 'lang',
    });
    setLanguageTag(lang);
    /* ----------------- */
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        async onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          /* --- INCLUDE THIS --- */
          await setLangServerCookie(lang, responseHeaders, setLangCookie);
          /* ----------------- */

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
```

## Our first Message

Let's create a `messages` folder in our project root. This is where we will store our messages. Then add an `en.json` file to it. 

```json
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"title": "Remix web example",
}
```

If you now run start your dev server you should see a new folder appear in your `src` folder called `paraglide`. This folder contains the compiled messages and any runtime code required by paraglide. Your messages live at `./src/paraglide/messages.js`, you will be importing from there.

Let's use the `title` message on our homepage. Create a route `($lang)._index.tsx`, import all messages from `paraglide/messages.js` and use the `title` message in the `h1` tag.

```tsx
import { Link } from '@remix-run/react';
import * as m from '<YOUR_PARAGLIDE_DIR>/messages';

export default function Index() {
  return (
    <div>
      <h1>{m.title()}</h1>
    </div>
  );
}
```

You should now see the message "Remix web example" on your homepage!

> Note: If you are using Visual Studio Code, you should install [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension). It will give you inline previews of messages and allow you to edit them right in your source code.

## Adding more languages

You can add more languages to your project by adding them to the `languageTags` array in your Inlang project settings. Let's add spanish to our project.

```json
// project.inlang/settings.json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "es"], // <-- Added Spanish
	"...": "..."
}
```

Then add a messages file for the new language. 

```json
// messages/es.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"title": "Remix web de ejemplo",
}
```

If you now run the dev server, and visit `/en` and `/es`, you should see the Server Components switch languages. 

## Navigating

You can use Remix `<Link>` to navigate between `/en` and `/es`.

```tsx
import { Link } from '@remix-run/react';
import * as m from '<YOUR_PARAGLIDE_DIR>/messages';

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>{m.title()}</h1>
      <ul>
        <li>
          <Link
            to="/en"
            reloadDocument
          >
            EN
          </Link>
        </li>
        <li>
          <Link
            to="/es"
            reloadDocument
          >
            ES
          </Link>
        </li>
      </ul>
    </div>
  );
}
```

If you don't want to reload the document please check out our dynamic example [here](https://github.com/BRIKEV/remix-paraglidejs/tree/main/examples/remix-paraglidejs-example).

## Next Steps

You should now have a fully functional multilingual Remix app using ParaglideJS.

You can check out the full source code of this example [here](https://github.com/BRIKEV/remix-paraglidejs).

If you want to learn more about ParaglideJS, check out the [ParaglideJS Documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). If you need help or have some ideas, feel free to reach out to us on [Discord](https://discord.gg/gdMPPWy57R) or open a Discussion on [GitHub](https://github.com/opral/monorepo/discussions).

