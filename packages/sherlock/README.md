# Sherlock – i18n inspector for Visual Studio Code

<p>
<a href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/inlang.vs-code-extension?color=1E90FF&label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/d/inlang.vs-code-extension?color=32CD32" alt="Visual Studio Marketplace Downloads" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/i/inlang.vs-code-extension?color=3CB371" alt="Visual Studio Marketplace Installs" /></a>
<br/>
<a href="https://github.com/opral/inlang" target="__blank"><img src="https://img.shields.io/github/last-commit/opral/inlang?color=9370DB" alt="GitHub last commit" /></a>
<a href="https://github.com/opral/inlang-sherlock/issues" target="__blank"><img src="https://img.shields.io/github/issues/opral/inlang-sherlock?color=20B2AA" alt="GitHub issues" /></a>
<a href="https://github.com/opral/inlang" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/opral/inlang?style=social"></a>
</p>

Visualize, edit, and lint translated strings effortlessly using Inline Decorations & Hover Support. Extract new strings with a simple click, making localization tasks more intuitive and efficient.

<div>
	<p>
		<br>
		<a href='https://inlang.com/c/apps' target="_blank">🕹️ Other i18n Apps</a>
		·
		<a href='https://inlang.com/m/r7kp499g' target="_blank">📄 Docs</a>
		·
		<a href='https://discord.gg/gdMPPWy57R' target="_blank">💙 Discord</a>
		·
		<a href='https://twitter.com/inlangHQ' target="_blank">🐦 Twitter</a>
	</p>
	<br />
</div>

<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/sherlock-cover-small.png"/>

<br>
<br>

✅ Streamline the i18n translation process.

✅ Visualize, edit, and lint translations.

✅ Extract new translations with a simple click.

<br>

# Quick start

<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/sherlock-start.png"/>

Install the extension and click `Getting Started` in the `Sherlock Tab`.

> You need a git repository to use the Sherlock extension, as it leverages git functionality (the inlang ecosystem is built on git).

### Manual setup

#### 1. Create a `project.inlang/settings.json` in the **root** of your project

You can use the following template when using JSON files as translation files. If not, please look for other [supported resource file types](https://inlang.com/):

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/schema/project-settings",
	// the "source" language tag that is used in your project
	"baseLocale": "en",
	// all the language tags you want to support in your project
	"locales": ["en", "de"],
	"modules": ["https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"], // or use another storage module: https://inlang.com/c/plugins (i18next, json, inlang message format)
	"settings": {}
}
```

> You might need another module if you are using a different resource file type. You can find all available modules [here](https://inlang.com/c/plugins).

#### 2. Decide on a **syntax matcher**

You should continue with **installing a syntax matcher**. There are multiple syntax matcher available:

- m function matcher: https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher
- t function matcher: https://inlang.com/m/698iow33/plugin-inlang-tFunctionMatcher
- _if you are using the i18next module, everything is already built-in_
- _if you are using next-intl, you need https://inlang.com/m/193hsyds/plugin-inlang-nextIntl_

#### 3. ✨ Recommended

If you want to add lint rules to your experience, you can add them from https://inlang.com/c/lint-rules

#### Requirements:

- VS Code version 1.84.0 or higher.
- Node.js version v18 or higher.

---

# Features

## Manage Translations directly from your Code

See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/ide-inline.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">🔎 Inline Annotations</p>
			<p>See translations directly in your code. No more back-and-forth looking into the translation files themselves.</p>
		</div>
	</div>
</div>

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/ide-extract.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">✂️ Extract Messages (translations)</p>
			<p>Extract new strings with a simple click, making localization tasks more intuitive and efficient. Visualize, edit, and lint translated strings effortlessly using Inline Decorations & Hover Support.</p>
		</div>
	</div>
</div>

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/ide-lint.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">❌ Message Linting</p>
			<p>Get notified about missing translations and other issues directly in your IDE.</p>
		</div>
	</div>
</div>

<br>

## Sherlock tab - Transparent & Fast

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/sherlock-monorepo.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">📦 Monorepo support</p>
			<p>You can have multiple projects in your repository. The Sherlock tab makes it easy to switch from one to another.</p>
		</div>
	</div>
</div>

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/sherlock-update.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">🔁 Update Translations</p>
			<p>Translations from the resource files are automatically updated when you change the source text.</p>
		</div>
	</div>
</div>

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/sherlock-errors.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">⚠ Transparent Errors</p>
			<p>In the tab menu, you can see project errors if the setup is broken.</p>
		</div>
	</div>
</div>

<br>

## Customization

### Custom preview language

You can customize the preview language in the settings. This is useful if you want to see how your translations look in a specific language. This setting is also available in the bottom status bar.

```json
"sherlock.previewLanguageTag": "de"
```

### Custom extension colors

You can customize the colors for inline annotations directly through the VS Code settings JSON file. This feature allows you to set different colors for `info` and `error` states, enhancing the readability and usability of inline annotations.

Add the following properties to your VS Code `settings.json` file to customize annotation colors:

```json
"sherlock.editorColors": {
	"info": {
		"foreground": "#color",
		"background": "rgba(number, number, number, 0.2)", // needs transparency
		"border": "#color"
	},
	"error": {
		"foreground": "#color",
		"background": "rgba(number, number, number, 0.2)", // needs transparency
		"border": "#color"
	}
}

// or (for all extensions)

"workbench.colorCustomizations": {
	"editorError.foreground": "#color",
	"editorError.background": "#color",
	"editorError.border": "#color",
	"editorInfo.foreground": "#color",
	"editorInfo.background": "#color",
	"editorInfo.border": "#color"
}
```

### Disable Inline Annotations

You can disable inline annotations by setting the following property to `false` in your VS Code `settings.json` file or by using the command `Sherlock: Toggle Inline Annotations`. The default value is `true`.

```json
"sherlock.inlineAnnotations.enabled": false
```

### Disable Auto Human ID Generation

You can disable the automatic generation of human IDs by setting the following property to `false` in your VS Code `settings.json` file. The default value is `true`.

```json
"sherlock.extract.autoHumanId.enabled": false
```

> [!NOTE]  
> Tip: It's best practice to use random names for your messages. Read this [guide](https://inlang.com/documentation/concept/message#idhuman-readable) for more information.

#### Troubleshooting

If you are having trouble with the **loading icon** not disappearing, this is a known issue & we are working with Visual Studio Code to fix it. In the meantime, you can right-click the Inlang icon to hide it:

<img width="25%" src="https://cdn.jsdelivr.net/gh/opral/inlang/packages/sherlock/assets/hide-badge.png"/>

## Support: Join our Discord / Open an issue on GitHub!

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](<[https](https://github.com/opral/inlang/issues/new/choose)>). We are happy to help!

<style>
.flex-container {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}
.flex-item {
	width: 100%;
}
@media (min-width: 600px) {
	.flex-item {
		width: calc(50% - 16px); /* Two columns with a small gap between them */
		margin-bottom: 0;
		padding: 0 8px;
	}
}
.flex-item .bold {
	font-weight: bold;
	font-size: 20px;
}
</style>
