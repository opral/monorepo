<div>
    <p align="center">
        <img width="300" src="https://raw.githubusercontent.com/inlang/inlang/main/source-code/ide-extension/assets/readme-logo.png"/>
    </p>
    <h2 align="center">
        Open Source Localization Solution for Software
    </h2>
    <h3 align="center">
        <a href="https://inlang.com" target="_blank">Website</a> · <a href="https://github.com/inlang/inlang" target="_blank">GitHub</a> · <a href="https://inlang.com/documentation" target="_blank">Documentation</a>
    </h3>
</div>

# Inlang IDE Code Extension

This extension provides a seamless integration of the [Inlang](https://inlang.com) localization solution into your IDE.

## 1️⃣ Setup

Create a inlang.config.js in the root of your project. You can use the following template:

```js
export async function defineConfig(env) {
	const { default: ideExtensionPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/ide-extension-plugin@latest/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [ideExtensionPlugin()],
	}
}
```

## 2️⃣ Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

## Features

### 🔎 Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

// TODO: Create new image

### ✂️ Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

// TODO: Create new image
