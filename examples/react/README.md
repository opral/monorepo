import CodeBlock from '@theme/CodeBlock';
import NpmInstall from '../../docs-website/src/npm-install.md'

> @GitHub reader: rendered version version is [here](https://docs.inlang.dev/getting-started/react)  
> @inlang reader: source code can be found [here](https://github.com/inlang/inlang/tree/main/examples/react)

# Quickstart

1. Clone the [inlang repository](https://github.com/inlang/inlang) by running

```bash
git clone https://github.com/inlang/inlang.git
```

2. Open `inlang/examples/react` in VSCode

3. Install the [inlang VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension)

4. Run

```bash
1. npm install
2. npm run start
```

The site should now be running on [http://localhost:3000](http://localhost:3000).

# Add inlang to an existing React project

## 1. Configure the SDK

> Read more about the SDK [here](/overview/sdk)

### 1.1 Install the SDK

> Concurrently allows us to run the dev script, typesafe-i18n and importer in parallel.

<NpmInstall />

For full documentation see the [typesafe-i18n docs](https://github.com/ivanhofer/typesafe-i18n) and [@inlang/typesafe-i18n-importer docs](https://github.com/inlang/inlang/tree/main/packages/typesafe-i18n-importer).

### 1.2 Create the `.typesafe-i18n.json` config file

- `adapter` specifies that the generates i18n files should be react compatible.

```js title="/.typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "react"
}
```

### 1.3 Create the `inlang.config.json` file

- `projectId` create a project at [inlang](https://app.inlang.dev) and copy the project id.
- `wrappingPattern` defines how a key (keyname) should be wrapped when creating a key with the [inlang
  VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension). For React it's
  "LL.keyname()".

```js title="/inlang.config.json"
{
  "projectId": "your-project-id",
  "vsCodeExtension": {
    "wrappingPattern": "LL.keyname()"
  }
}
```

### Adjust the build script

The SDK (typesafe-i18n & the inlang typesafe importer) runs as background processes during development to constantly fetch updated translations from the dashboard and generate corresponding types. Since the processes should run simultaneously next to the regular development process (`npm run dev`), we adjust the dev script in the `package.json` to run the regular dev script, the SDK and the importer in parallel with the help of [concurrently](https://www.npmjs.com/package/concurrently).

```json title="Adjust the start script in ./package.json to:"

"start": "npx concurrently --kill-others 'react-scripts start' 'npx typesafe-i18n' 'npx @inlang/typesafe-i18n-importer'"

```

## 2. Add Typesafe initialization

Initialization of the internationalization should be done close to the root with the following tags.

```js
<TypesafeI18n initialLocale='en'>
    <!-- ... -->
</TypesafeI18n>
```

## 3. Wrap all text in the translation functions

For React the default option is to use i18nObjects in the following way:

```js
function HelloWorld(props) {
  const { LL } = useContext(I18nContext);

  return LL.helloWorld();
}
```

If you have the vscode extension, just write the string, right click and send to inlang. The extension will handle the rest!

## 4. Set locale when user desires

```js
<button onClick={() => setLocale("de")}>Deutsch</button>
```

To see additional tools see the [typesafe-i18n docs](https://github.com/ivanhofer/typesafe-i18n)

## 5. Start translating in the app!

Add your team members, or start translating yourself at [app.inlang.dev](https://app.inlang.dev/)
