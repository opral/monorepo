# Use paraglideJS in monorepos

Monorepos introduce unique challenges when it comes to the build process and setup. This guide will help you integrate paraglideJS into a monorepo structure. 

### What you need to know?

To use paraglideJS in a monorepo, inlang needs the following components:
1. Ensure that there is a `project.inlang.json` file in the root of your project.
2. Inside the `project.inlang.json` file, specify a plugin that instructs the system on how to load and save messages in the `messages.json` file, which stores translations.

You can find more detailed information on these steps in this guide -> [How to setup inlang for your project](https://inlang.com/g/49fn9ggo/guide-niklasbuchfink-howToSetupInlang)

### Initial setup

Here's an example of your folder structure:
```txt
├── frontend
│   ├── pages
│   │   ├──  index.tsx
│   │   ├──  ...
│   ├── package.json
├── backend
│   ├── ...
├── project.inlang.json
└── messages.json
```

In this setup, you have a monorepo with two main folders: `frontend` and `backend`. You intend to use paraglideJS in `.tsx` files within the frontend folder. As mentioned earlier, the `project.inlang.json` must be located in the root directory, and the messages.json file can be placed in a different directory, as this can be defined in the `project.inlang.json`.

Your `project.inlang.json` could look like this:

```json
{
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de", "zh"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format/dist/index.js",
	],
	"plugin.inlang.messageFormat": {
		"filePath": "./messages.json"
	}
}
```

### Configuring paraglideJS
paraglideJS requires compiling messages into JavaScript as part of the build process. As documented in the [docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), paraglideJS offers two essential configuration options:

**namespace:** Allows you to define a namespace for each monorepo module to prevent ID conflicts.
**project:** Permits you to specify the path to the `project.inlang.json` file, enabling module-specific build script configuration within your chosen framework.

Here's an example of package.json configuration for Vite:
```json
"scripts": {
	"build": "paraglide-js compile --namespace frontend --project ../project.inlang.json && vite build",
}
```

### Test

To ensure everything is set up correctly:
1. Run the build command.
2. Verify that the compilation step completes successfully.
3. Confirm that you can use the paraglide functions in your frontend files.


If you have problems, file an [issue](https://github.com/inlang/monorepo/issues) or ask on [Discord](https://discord.gg/gdMPPWy57R).