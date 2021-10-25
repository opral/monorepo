import CodeBlock from '@theme/CodeBlock';

> @GitHub reader: rendered version version is [here](https://docs.inlang.dev/getting-started/react)  
> @inlang reader: source code can be found [here](https://github.com/inlang/inlang/tree/main/examples/react)

To run the example, paste the following into the terminal:

```bash
git clone https://github.com/inlang/inlang.git
cd inlang/examples/react
npm install
npm run dev
```

This example is a the default React example created with the [create-react-app](https://github.com/facebook/create-react-app). The example can be started with the following commands:

The site should now be running on [http://localhost:3000](http://localhost:3000).

# Integrating the Inlang flow into your existing React project

## 1. Configure the SDK

> Read more about the SDK [here](/overview/sdk)

### Install the SDK

```bash
npm i typesafe-i18n
npm i @inlang/typesafe-i18n-importer
```

For full documentation see the [typesafe-i18n docs](https://github.com/ivanhofer/typesafe-i18n) and [@inlang/typesafe-i18n-importer docs](https://github.com/inlang/inlang/tree/main/packages/typesafe-i18n-importer).

### (Optional) Install the Visual Studio Code extension

If using Visual Studio Code, it is highly recommended to install the extension to allow for key generation while never leaving the file.

```bash
ext install inlang.vscode-extension
```

For full documentation see the [inlang vscode-extension docs](https://github.com/inlang/inlang/tree/main/packages/inlang-vscode-extension)

### Create the .typesafe-i18n.json config file

- `adapter` specifies that the generates i18n files should be react compatible.

```js title="/.typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "react"
}
```

### Create the inlang.config.json file

- `projectId` specifies the projectId which is supplied by the dashboard.
- `wrappingPattern` specifies what the optional vscode extension will wrap your key in. Only required for vscode.

```js title="/inlang.config.json"
{
  "projectId": "your-project-id",
  "vsCodeExtension": {
    "wrappingPattern": "LL.keyname()"
  }
}
```

### Adjust the build script

The SDK runs as background process during development to constantly fetch updated translations from the dashboard.

```bash
{
  "dev": "npm-run-all start typesafe-i18n @inlang/typesafe-i18n-importer",
  "typesafe-i18n": "typesafe-i18n",
  "@inlang/typesafe-i18n-importer": "npx @inlang/typesafe-i18n-importer"
}
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
    const { LL } = useContext(I18nContext)

    return LL.helloWorld()
}
```

If you have the vscode extension, just write the string, right click and send to inlang. The extension will handle the rest!

## 4. Set locale when user desires

```js
<button onClick={() => setLocale('de')}>Deutsch</button>
```

To see additional tools see the [typesafe-i18n docs](https://github.com/ivanhofer/typesafe-i18n)

## 5. Start translating in the app!

Add your team members, or start translating yourself at [app.inlang.dev](https://app.inlang.dev/)
