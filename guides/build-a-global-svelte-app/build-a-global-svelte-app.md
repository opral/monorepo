# Build a global svelte app

In this guide we will use [paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) and [ide-extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

## 1. Starting point

Start with a basic SvelteKit app with `npm create`:
```
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
git init
```

## 2. Initialize Paraglide

```
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

Paraglide is now ready to be used.

## 3. Start working with Paraglide

You can find your translation files in the `messages` directory.
In the beginning the folder is empty. There two ways of adding messages:

### Add messages through ide extension (recommended)

- Install the ide extension from the vs-code marketplace. 
[See extension on inlang.com](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
[vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

- Reload window (only needed once).
`CMD` + `Shift` + `P` -> Developer: Reload Window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.

- Mark a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` -> Inlang: Extract message. Gime the message an ID and hit enter.

- This command extracts the `sourceLanguage` (en) translation that was hard-coded and puts it in the `en.json` file in the `messages` directory.

- compile translation `npx @inlang/paraglide-js compile`


### Add messages manually

- Go to the `messages` directory and create a `en.json` file in it. (Make sure the naming is according to the BCP-47 languageTags in the `inlang.project.json`)

- Add a message in the file.
```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello": "Hello World"
}
```

- compile translation `npx @inlang/paraglide-js compile`


## 4. See Paraglide JS in action

Let's use Paraglide to display messages in the frondend.

```ts
<script>
// depending on the file adjust the path
import * as m from "./paraglide-js/messages"
</script>

// use a message instead if hardcoded string
m.hello() // Hello world
```

Let's change the language.

To do that, we need a german translation for the message `hello`. 
You could ether use the [ide-extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) or add the german file manually again.

```ts
<script>
	import * as m from "./paraglide-js/messages"
	import { setLanguageTag } from "./paraglide-js"
</script>

//change language to german
<div onclick={setLanguageTag("de")}>
    Switch to german
</div>

// display message
<div>
	{m.hello()}
</div>
```

This guide is based on `paraglide-js 1.0.0-prerelease.9`, `plugin-message-format 2.0.0` and `m-function-matcher 0.5.0`.`
If you have problems, file an [issue]() or ask on [Discord]().
