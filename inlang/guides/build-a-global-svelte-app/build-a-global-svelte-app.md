# Build a global svelte app

In this guide we will use [paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) and [ide-extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

### 1. Get the setup ready 

Start with a basic SvelteKit app with `npm create`:
```
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
```

Add the `project.inlang.json` file to the root of your repo:
```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"],
	"modules": ["https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format/dist/index.js"],
	"plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{languageTag}.json"
	}
}
```
The file is the location where you add the different inlang modules. It could be plugins, lint-rules, or libraries ... We need to define a sourceLanguage (English -> en) and available languages (In our case, English and German -> en, de). To get this running, we use the [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat). It is a plugin, that loads and saves translations from your repo into your inlang project [See different plugins](https://inlang.com/search?q=load%20save). For the `inlang-message-format` we need to define a filePath where the translations should be stored.

To test if we did that right, let's use the inlang CLI. 
```
npx @inlang/cli project validate
```
If you did everything right, you'll get `✔ The project settings file is valid! `

### 2. Add paraglide

Now install paraglide.js into your project:
[Read paraglide.js docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
```
npm install @inlang/paraglide-js
```

Add the paraglide compiler to the build script in your `package.json`:
```json
{
  "scripts": {
    "build": "paraglide-js compile && vite build"
  }
}
```
Make sure the `package.json` and `project.inlang.json` are on the same dir. Otherwise, change the project path in the `compile` command with `--project <path>`. To support monorepo projects, there is a namespace option in the `compile` command. We can enter my-app.

Run build to check if the script works:
```
npm run build
```
If you did everything right, you'll get `✔ Successfully compiled the project.` in the terminal.

<br/>

Please note that before Paraglide-js's Vite plugin is released, you may be troubled by [Vite's Dependency Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html), which saves compiled dependencies in `node_modules/.vite` for subsequent use. However, the working mechanism of `paraglide-js` causes Vite to incorrectly cache `messages.js`, causing the application to use stale messages.

We recommend that you add `@inlang/paraglide-js` to the exclusion list of dependency optimizations:
```js
// vite.config.js/ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@inlang/paraglide-js']
  },
  ssr: {
    noExternal: ['@inlang/paraglide-js']
  },
});
```

### 3. Add message that can be translated.

Now let's use the ide-extension to extract some hard-coded strings from the example project. Install the ide-extension -> [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension).

Add the m-function-matcher plugin to the `project.inlang.json`, so the ide-extension knows how to read paraglide syntax:
```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"],
	"modules": [
	    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format/dist/index.js",
	    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
    ],
	"plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{languageTag}.json"
	}
}
```
Reload the window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.
![image](https://github.com/inlang/monorepo/assets/58360188/b31edf5b-fd14-4054-99aa-1d32d4084d12)

After we installed the ide-extension, we can search for a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` to open a context menu.

![image](https://github.com/inlang/monorepo/assets/58360188/573a7e58-565d-4cb7-9aa3-1466b4b4069e)

Now select `Inlang: Extract Message`. This command extracts the `sourceLanguage` (en) translation that was hard-coded and puts it in the `messages.json` file (message-format) in the `/src` directory. All you need to do is add a message-id for it.

![image](https://github.com/inlang/monorepo/assets/58360188/2ea7bb89-c051-4624-b9df-5a67d5c1e9d4)

If the m function does not get recognize you need to import it:
```ts
<script>
	import * as m from "./../paraglide-js/messages"
</script>
```

After adding the extension, it should show you the translation inline. You could also add translations to the id or open a translation editor with the ide extension ... [Further reading](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

> If the message is not yet compiled use `npm @inlang/paraglide-js compile`. (Watcher comes soon)

### 4. See paraglide.js in action

With the ide-extension, add a German translation (hover over the `m` function and use the edit button in the `de` field). According to the paraglide.js [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) you can use `setLanguageTage("de")` to change the language on an event (Mostly used in a language picker). 

![image](https://github.com/inlang/monorepo/assets/58360188/55ad46fd-45c3-4526-8d42-248798f490e5)

Example:
```ts
<script>
	import * as m from "./../paraglide-js/messages"
	import { setLanguageTag } from "./../paraglide-js"
</script>

<div onclick={setLanguageTag("de")}>
    Switch to german
</div>
```

After that, switch to development with:
```
npm run dev
```

Click on the switcher and see the result.

This guide is based on `paraglide-js 1.0.0-prerelease.9`, `plugin-message-format 2.0.0` and `m-function-matcher 0.5.0`.`
If you have problems, file an [issue]() or ask on [Discord]().
