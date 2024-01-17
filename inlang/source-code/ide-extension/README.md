

<div>
	<h1>inlang – Supercharge i18n in VS Code</h1>	
	<p>
		<br>
		<a href='https://inlang.com/c/apps' target="_blank">🕹️ Apps</a>
		·
		<a href='https://inlang.com/documentation' target="_blank">📄 Docs</a>
		·
		<a href='https://discord.gg/gdMPPWy57R' target="_blank">💙 Discord</a>
		·
		<a href='https://twitter.com/inlangHQ' target="_blank">🐦 Twitter</a>
		·
		<a href='https://github.com/orgs/inlang/projects/39' target="_blank">🗺️ Roadmap</a>
	</p>
	<br />
</div>

✅ Supercharge i18n within VS Code with powerful tools designed to streamline the translation process. 

✅ Visualize, edit, and lint translated strings effortlessly using Inline Decorations & Hover Support. 

✅ Extract new strings with a simple click, making localization tasks more intuitive and efficient.

<br>
<br>

<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-extension-cover.png"/>

<br>

## Manage Translations directly from your Code

See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-inline.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">🔎 Inline Annotaions</p>
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

## Inlang Tab - Transparent, Fast, Always Up-to-Date

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-monorepo.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">📦 Monorepo support</p>
			<p>You can have multible projects in your repository. The inlang tab makes it easy to switch from one to another.</p>
		</div>
	</div>
</div>

<br>

<div>
	<div class="flex-container">
		<div class="flex-item">
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-update.png"/>
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
			<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-errors.png"/>
		</div>
		<div class="flex-item">
			<p class="bold">⚠ Transparent Errors</p>
			<p>In the tab menu you can see project errors if the setup is broken.</p>
		</div>
	</div>
</div>

<br>

## Quick start

<img width="100%" src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-start.png"/>

Just install the extension and click on `Getting Started` in the `Inlang Tab`. 

### Manual setup

#### 1. Create a `project.inlang/settings.json` in the **root** of your project

You can use the following template when using json files as translation files, if not, please look for other [supported resource file types](https://inlang.com/):

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

You should continue with **installing a syntax matcher**. There are multiple syntax matcher available like:

- m function matcher: https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher
- t function matcher: https://inlang.com/m/698iow33/plugin-inlang-tFunctionMatcher
- *if you are using the i18next module, everything is already built-in*

#### 3. ✨ Recommended

If you want to add lint rules to your experience, you can add them from: https://inlang.com/c/lint-rules

#### Requirements:

- VS Code version 1.84.0 or higher.
- Node.js version v18 or higher.

## Support: Join our Discord!

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/opral/monorepo/issues/new/choose)>). We are happy to help!


<style>
.flex-container {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: center;
}
.flex-item {
	width: 100%;
}
@media (min-width: 600px) {
	.flex-item {
		width: calc(50% - 16px); /* Two columns with a small gap between them */
		margin-bottom: 0;
	}
}
.flex-item .bold {
	font-weight: bold;
	font-size: 20px;
}
</style>