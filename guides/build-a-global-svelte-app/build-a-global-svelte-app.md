# Build a global svelte app

In this guide we will use [paraglide.js](), [inlang-message-format]() and [lint rules]().

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
		"filePath": "./src/messages.json"
	}
}
```
The file is the location where you add the different inlang modules to. Could be plugins, lint-rules, libraries ... We need to define a sourceLanguage (English -> en) and available languages (In our case English and German -> en, de). To get this running we use the [inlang-message-format](). It is a plugin, that loads and saves translations from your repo into your inlang project [See different plugins](). For the `inlang-message-format` we need to defined a filePath where the translations should be stored.

To test if we did that right let's use the inlang CLI. 
```
npx @inlang/cli project validate
```
If you did everything right you'll get `✔ The project settings file is valid! `

### 2. Add paraglide

Now install paraglide.js into your project:
[Read paraglide.js docs]()
```
npm install @inlang/paraglide-js
```

Add the paraglide compler to the build script in your `package.json`:
```json
{
  "scripts": {
    "build": "paraglide-js compile --namespace <your project name> && vite build"
  }
}
```
Make sure the `package.json` and `project.inlang.json` are on the same dir. Otherwise change the project path in the `compile` command with `--project <path>`. To support monorepo projects there is a namespace option in the `compile` command. We can enter my-app.

Run build to check if the script works:
```
npm run build
```
If you did everything right you'll get `✔ Successfully compiled the project.` in the terminal.

### 3. Add message that can be translated.

Now let's use the ide-extension to extract some hard coded strings from the example project. Install the ide extension -> [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension).

Add the ide-extension-plugin to the `project.inlang.json`:
```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"],
	"modules": [
	    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format/dist/index.js",
	    "https://cdn.jsdelivr.net/npm/@inlang/plugin-paraglide-js@latest/dist/index.js"
    ],
	"plugin.inlang.messageFormat": {
		"filePath": "./src/messages.json"
	}
}
```
Reload the window. On the bottom it should display for some seconds after realod: `inlang's extension activated`.

After we installed the ide-extension we can search for a hard-coded string. For example on the about page. Mark the string with your cursor and hit `command` + `.` to open a context menu.

Now select `Inlang: Extract Message`. This command extracts the sourceLanguage Translation that was hardcoded and puts it in the messages.json file (message-format) in the src directory. All you need to do is adding a message id for it.

If the m function does not get recognize you need to import it:
```ts
<script>
	import * as m from "@inlang/paraglide-js/<namespace>/messages"
</script>
```

After adding the extension, it should show you the translation inline. You could also add translations to the id or open a translation editor with the ide extension ... [Further reading](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

### 4. See paraglide.js in action

With the ide-extension, add a german translation (hover over the `m` function and use the edit button in the `de` field). According to the paraglide.js [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) you can use `setLanguageTage("de")` to change the language on an event (Mostly used in a language picker). 

Example:
```ts
<script>
	import * as m from "@inlang/paraglide-js/<namespace>/messages"
	import { setLanguageTag } from "@inlang/paraglide-js/<namespace>"
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

If you have problems file an [issue]() or ask on [Discord]().
