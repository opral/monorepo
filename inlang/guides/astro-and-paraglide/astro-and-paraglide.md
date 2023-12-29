# Translating an Astro App with Paraglide

In this Guide, we'll integrate the [ParaglideJs](/m/gerre34r/library-inlang-paraglideJs) i18n library into an Astro project. We'll use Paraglide to translate the page shell, aswell as some client side islands.

If you are looking to translate the _content_ of your app, you should check out the official [Astro i18n Recipie](https://docs.astro.build/en/recipes/i18n#_top). Astro does this very well out of the box. You only need an i18n library for the page-shell and client side components.


## Why Paraglide?
There is no shortage of i18n libraries for JavaScript, so why go with Paraglide? Paraglide offers some unique features that make it a great fit for Astro in particular.

When using Astro, usually only a small part of your app runs on the client. Consequently you usually only have a few messages that are needed on the client. If you were to use i18next, you would need to ship a 40kb runtime to the client, even if you only need to translate a few words. 

Paraglide avoids this in a few ways. First, it's runtime is tiny, usually less than 100 bytes. Second, it only ships the messages that are actually used on the client. Even if you have thousands of messages in your app, if your island only uses 10 of them, only those 10 will be shipped to the client. Paraglide's bundle scales to zero. 

Finally, Paraglide is fully typesafe. This means you get autocompletion on which messages are available, and on which arguments they take.

## Setup

This guide assumes that you already have an Astro project set up, with some basic i18n routing.
If you don't, you can follow the [official Astro Quickstart](https://docs.astro.build/en/install/auto/).

The easiest way to add translated pages to your Astro project is to create a folder for each language. Often the default language get's placed in the root, and the other languages in subfolders. For example:

```
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── de/
│   │   │   ├── index.astro
│   │   │   ├── about.astro
│   │   ├── fr/
│   │   │   ├── index.astro
│   │   │   ├── about.astro
```

This guide assumes that you have a similar setup. If you don't, you can follow the [official Astro i18n Recipie](https://docs.astro.build/en/recipes/i18n#_top).

If that's the case we can install Paraglide:

```bash
npx @inlang/paraglide-js init
npm i
```

This will have done a few things:

- Created an inlang project in your project root
- Added the required devDependencies to your `package.json`
- Added the paraglide compiler to your `package.json` build scripts

If you now run `npm run build`, you should see the paraglide compiler running alongside Astro's compiler. By default the output will be placed in `./src/paraglide`. I would also recommend adding the paraglide compiler to your dev script, so that it recompiles whenever you change a message.

```json
"scripts": {
    "dev": "paraglide-js compile --project ./project.inlang --watch & astro dev",
    "build": "paraglide-js compile --project ./project.inlang && astro build"
}
```

## Adding Languages

You can add languages by adding them in the settings file `project.inlang/settings.json`. All languages that you intend to use must be listed here.

```json
{
    "languageTags": ["en", "de", "ar"],
    "sourceLanguageTag": "en",
}
```

## Adding Messages

The default path for translation files is `./messages/{lang}.json`. You can change this option in `project.inlang/settings.json`. The Files just contain a Key-Value pair of the message ID and the message itself.

```json
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hello World",
	"greeting": "Hello {name}"
}
```

You can add messages in two ways:

1. Manually editing the translation files
2. Using the [inlang IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

### Add messages through ide extension (recommended)

- Install the ide extension from the vs-code marketplace.
  [See extension on inlang.com](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
  [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

- Reload window (only needed once).
  `⌘ or Ctrl` + `Shift` + `P` -> Developer: Reload Window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.

- Select a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` -> Inlang: Extract
  message. Give the message an ID and hit enter.

- This command extracts the hard-coded string and places it into the source language translation file `en.json` in the `messages` directory.


## Using Messages

After the compiler has run, you can import messages into your code by importing the `src/paraglide/messages.js` file. It's recommended to do a wildcard import.

```ts
import * as m from "../paraglide/messages.js"

m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John
```

Each message is a function that returns the message in the current language. If the message requires parameters, typescript will enforce that you pass them in.

## Switching Languages
Now it get's interesting. Switching languages in Paraglide works by calling `setLanguageTag`, which is exported from `src/paraglide/runtime.js`. Messages are not reactive, so you need to call `setLanguageTag` before you use any messages.

```ts
import * as m from "../paraglide/messages.js"
import { setLanguageTag } from "../paraglide/runtime.js"

setLanguageTag("en")
m.hello_world() // Hello World

setLanguageTag("de")
m.hello_world() // Hallo Welt
```

The challenge is in calling `setLanguageTag` at the right time. We need to do it twice, once on the server and once on the client.
1. Determine the language of the current page on the server before any messages are used.
2. Pass that language to the client for use within islands.

Fortunately this isn't hard.

### Adding Middleware
To set the language on the Server we can use Astro's [Middleware](https://docs.astro.build/core-concepts/middleware). Middleware is a function that runs on the server before the page is rendered. We can use it to set the language tag.


At `src/middleware.ts`, add the following:
```ts
import { setLanguageTag, isAvailableLanguageTag, sourceLanguageTag } from "./paraglide/runtime"

export function onRequest({ url }: { url: URL }, next: () => Response | Promise<Response>) {
	setLanguageTag(() => getLangFromPath(url.pathname))
	return next()
}

function getLangFromPath(path: string) {
	const [lang] = path.split("/").filter(Boolean)
	if (isAvailableLanguageTag(lang)) return lang
	return sourceLanguageTag
}
```


`getLangFromPath` is a helper function that returns a language for a given Path. The implementation depends on your routing strategy. The function in the example assumes that the language tag is the first part of the path. For example `/de/about` would return `de`. If the language is not available, it will fall back to the source language set in `project.inlang/settings.json`. You can of course implement your own logic here.

Now whenever you go to a page such as `/de/about`, the middleware will set the language tag to `de`. If the language is not available, it will fall back to the source language set in `project.inlang/settings.json`.

### Passing the Language to the Client
We could duplicate the middleware code on the client, but there is a better way. We can pass the language tag to the client by setting the `lang` attribute on the `<html>` tag. For SEO reasons, this is a good idea anyway.

In your global Astro layout, add the following:
```tsx
---
import { languageTag } from "../paraglide/runtime.js"
---

<html lang={languageTag()}>
    <slot/>
</html>
```

Then, on the client, we need to call `setLanguageTag` with the value of the `lang` attribute. In the same file as before, add a `<script>` tag with the following code:

```tsx
---
import { languageTag } from "../paraglide/runtime.js"
---

<html lang={languageTag()}>
    <slot/>
</html>

<script>
    import { setLanguageTag, isAvailableLanguageTag, sourceLanguageTag } from "../paraglide/runtime.js"
    
    const lang = isAvailableLanguageTag(document.documentElement.lang) 
        ? document.documentElement.lang 
        : sourceLanguageTag;
    
    setLanguageTag(lang)
</script>
```

That's it. The message functions will now return the correct language on the client and the server.

## Translating the Page Shell
Now it's really just a matter of going through your app and extracting any hard-coded strings. This is easiest to do with the [inlang IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

Then you just import the messages and use them in your components. 

```
---
import * as m from "../paraglide/messages.js"
import DefaultLayout from "../layouts/default.astro"
---

<DefaultLayout>
    <h1>{m.hello_world()}</h1>
    <p>{m.greeting({ name: "John" })}</p>
</DefaultLayout>
```

## Translating Client Side Components
Since we already added the script to set the language tag on the client, we can now just use the same message functions in our client side components.

Here is an example `Counter.astro`:

```html
<div class="counter">
    <span class="count" data-count="0" >{m.count({ count: 0})}</span>
    <button class="increment">+</button>
</div>

<script>
    import * as m from "../paraglide/messages"
    const counters = document.querySelectorAll('.counter');

    for (const counter of counters) {
            const count = counter.querySelector('.count');
            const increment = counter.querySelector('.increment');
            increment.addEventListener('click', () => {
                const value = parseInt(count.dataset.count!);
                count.dataset.count = value + 1;
                count.innerHTML = m.count({ count: value + 1});
            });
    }
</script>
```

We encourage you to run `npm run build` and inspect the output. You will see that only the message `m.count` is shipped to the client. Any other messages are not included in the bundle.

## Feedback
If you have any suggestions for this guide, please reach out to us on [Discord](https://discord.gg/gdMPPWy57R), or open an issue on [GitHub](https://www.github.com/inlang/monorepo/issues). If you have trouble following, don't hesitate to ask for help. We are happy to help getting you set up.
