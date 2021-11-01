import CodeBlock from '@theme/CodeBlock';
import NpmInstall from '../../docs-website/src/npm-install.md'

> @GitHub reader: rendered version version is [here](https://docs.inlang.dev/getting-started/svelte-kit)  
> @inlang reader: source code can be found [here](https://github.com/inlang/inlang/tree/main/examples/svelte-kit)

# Quickstart

1. Clone the [inlang repository](https://github.com/inlang/inlang) by running

```bash
git clone https://github.com/inlang/inlang.git
```

2. Open `inlang/examples/svelte-kit-example` in VSCode

3. Install the [inlang VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension)

4. Run

```bash
1. npm install
2. npm run dev
```

The site should now be running on [http://localhost:3000](http://localhost:3000).

# Add inlang to an existing project

The following is a step by step guide to add inlang to an existing project.

## 1. Configure the SDK

> Read more about the SDK [here](/overview/sdk)

### 1.1. Install the SDK

> Concurrently allows us to run the dev script, typesafe-i18n and importer in parallel.

<NpmInstall />

For full documentation see the [typesafe-i18n docs](https://github.com/ivanhofer/typesafe-i18n) and [@inlang/typesafe-i18n-importer docs](https://github.com/inlang/inlang/tree/main/packages/typesafe-i18n-importer).

### 1.2. Create the `.typesafe-i18n.json` config file

- `adapter` specifies that the generates i18n files should be react compatible.

```js title="typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "svelte"
}
```

### 1.3. Create the `inlang.config.json` file.

- `projectId`: create a project at [inlang](https://app.inlang.dev) and copy the project id.
- `wrappingPattern`: defines how a key (keyname) should be wrapped when creating a key with the [inlang
  VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension). For Svelte Kit it's
  "$LL.keyname()".

```js title="inlang.project.json"
{
  "projectId": "YOUR PROJECT ID",
  "vsCodeExtension": {
    "wrappingPattern": "$LL.keyname()"
  }
}
```

### 1.4. Adjust the build script

The SDK (typesafe-i18n & the inlang typesafe importer) runs as background processes during development to constantly fetch updated translations from the dashboard and generate corresponding types. Since the processes should run simultaneously next to the regular development process (`npm run dev`), we adjust the dev script in the `package.json` to run the regular dev script, the SDK and the importer in parallel with the help of [concurrently](https://www.npmjs.com/package/concurrently).

Adjust the `dev` script in `package.json` to:

```json
 "scripts": {
   "dev": "npx concurrently --kill-others 'svelte-kit dev' 'npx typesafe-i18n' 'npx @inlang/typesafe-i18n-importer'",

   ... other scripts
 },
```

> The `--kill-others` flag ensures that if one script is failing all scripts fail. Otherwise, one
> script might fail silently.

## 2. Let the magic begin

### 2.1. Start the development process

`npm run dev`

Typesafe-i18n should have created the `i18n` folder in the directory and will continously listen for changes from the dashboard.

### 2.2. Initialize `typesafe-i18n` in `__layout`

Add the following to the `__layout` file to initialize to a certain language. This can then be changed on user demand.

```js title="routes/__layout.svelte"
<script context="module">
	import { initI18n } from '../i18n/i18n-svelte';

	export async function load({ page, fetch, session, context }) {
		const locale = 'en';
		await initI18n(locale);

		return {};
	}
</script>
```

### 2.3. Swap text to keys

Convert all text to be translated into keys, for Svelte Kit that mostly means using `$LL`

```js
    <script lang="ts">
        import LL from '../i18n/i18n-svelte'
    </script>
    {$LL.key({name: "John Doe"})}
```

### 2.4. Change the language

Use `setLocale(locale)` anywhere you want to provide a different language.

```js
    <script>
        import { setLocale } from '../i18n/i18n-svelte'
    </script>
    
    const locale = 'en'
    setLocale(locale);
```