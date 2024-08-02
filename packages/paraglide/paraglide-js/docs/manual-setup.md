# Manual Setup

The recommended way to set up Paraglide is with `npx @inlang/paraglide-js init`. Should that fail for some reason you can follow this manual setup guide.

> Also please open an issue if it fails

## 1. Install Dependencies

```bash
npm i -D @inlang/paraglide-js
```

## 2. Create an Inlang Project

Create a folder called `project.inlang` in your root-directory. Inside it, add a `settings.json` file with the following content: 

```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de", "de-CH"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
	],
	"plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{languageTag}.json"
	}
}
```

Eddit the `languageTags` and `sourceLanguageTag` fields to match the languages you want to support. 

## 3. Add the compile script

In `package.json` add a script that you will call to recompile. 

```diff
// package.json
{ 
    "scripts": {
+        "compile": "paraglide-js compile --project ./project.inlang --outdir ./src/paraglide"
    }
}
```



## 4. Add message files for each languages

In your root-directory, create a `messages` folder. Then add a `en.json` file to it. This is where your messages live. 

```json
// messages/en.json
{
    "$schema": "https://inlang.com/schema/inlang-message-format",
    "greeting": "Hello {name}!"
}
```

Add a `{lang}.json` file for each of your languages. 