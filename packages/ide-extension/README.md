

# Sherlock – i18n inspector for Visual Studio Code

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


<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-cover-small.png"/>

<br>
<br>

✅ Streamline the i18n translation process. 

✅ Visualize, edit, and lint translations.

✅ Extract new translations with a simple click.


<br>



# Let's get started

1. Add a `project.inlang` folder to your repository
2. Create a `settings.json` file to that new dir `project.inlang/settings.json`
3. Install a plugin that reads and writes your messages from the [inlang marketplace](https://inlang.com/c/plugins)
4. Install a installing a syntax matcher/function matcher from the [inlang marketplace](https://inlang.com/c/plugins)
---
1. **Optional**: Install lint rules to find errors in your translations from the [inlang marketplace](https://inlang.com/c/lint-rules)


## Manage Translations directly from your Code

See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-inline.png"/>
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
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-extract.png"/>
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
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-lint.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">❌ Message Linting</p>
			<p>Get notified about missing translations and other issues directly in your IDE.</p>
		</div>
	</div>
</div>

<br>

## Inlang Tab - Transparent & Fast

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-monorepo.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">📦 Monorepo support</p>
			<p>You can have multiple projects in your repository. The inlang tab makes it easy to switch from one to another.</p>
		</div>
	</div>
</div>

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-update.png"/>
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
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-errors.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">⚠ Transparent Errors</p>
			<p>In the tab menu, you can see project errors if the setup is broken.</p>
		</div>
	</div>
</div>

<br>

## Quick start

<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-start.png"/>

Install the extension and click `Getting Started` in the `Inlang Tab`. 

### Manual setup

#### 1. Create a `project.inlang/settings.json` in the **root** of your project

You can use the following template when using JSON files as translation files. If not, please look for other [supported resource file types](https://inlang.com/):

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/schema/project-settings",
	// the "source" language tag that is used in your project
	"sourceLanguageTag": "en",
	// all the language tags you want to support in your project
	"languageTags": ["en", "de"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"
	], // or use another storage module: https://inlang.com/c/plugins (i18next, json, inlang message format)
	"settings": {}
}
```

#### 2. Decide on a **syntax matcher**

You should continue with **installing a syntax matcher**. There are multiple syntax matcher available:

- m function matcher: https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher
- t function matcher: https://inlang.com/m/698iow33/plugin-inlang-tFunctionMatcher
- *if you are using the i18next module, everything is already built-in*

#### 3. ✨ Recommended

If you want to add lint rules to your experience, you can add them from https://inlang.com/c/lint-rules

#### Requirements:

- VS Code version 1.84.0 or higher.
- Node.js version v18 or higher.

#### Troubleshooting

If you are having trouble with the **loading icon** not disappearing, this is a known issue & we are working with Visual Studio Code to fix it. In the meantime, you can right-click the Inlang icon to hide it:

<img width="25%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/hide-badge.png"/>


## Support: Join our Discord / Open an issue on GitHub!

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/CNPfhWpcAa) or [create an issue](<[https](https://github.com/opral/monorepo/issues/new/choose)>). We are happy to help!


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
