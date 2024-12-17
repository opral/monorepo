# Plugin API

## Meta information

In order to effectively showcase our product in the marketplace and during installation, it is crucial to include the meta information.

### id

`plugin.${string}.${string}` `required`

Unique id of module. Consists of type (plugin), author and name.

```ts
// Example
id: "plugin.inlang.json";
```

### displayName

`Record<LanguageTag, string>` `required`
The name that is displayed in the marketplace. The name will be localized in the future that's why there is the languageTag. For now `en` is fine.

```ts
// Example
displayName: {
  en: "Plugin Name";
}
```

### description

`Record<LanguageTag, string>` `required`
The description that is displayed in the marketplace. It will be localized in the future that's why there is the languageTag. For now `en` is fine.

```ts
// Example
description: {
  en: "This is the plugin description";
}
```

<br/>

## Message Handling

The load and save functions specify how the SDK loads and saves messages to build the query.

### loadMessages

`function`

Retrieve messages from storage for the SDK. (For the message-format plugin, messages are stored in json files.)

```ts
	loadMessages?: (args: {
		settings: ProjectSettings & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<Message[]> | Message[]
```

### saveMessages

`function`
Save messages from SDK to storage.

```ts
	saveMessages?: (args: {
		messages: Message[]
		settings: ProjectSettings & ExternalSettings
		nodeishFs: NodeishFilesystemSubset
	}) => Promise<void> | void
```

<br/>

## Add Information

If Apps need specific information or configuration you can also pass in a custom api. This is for example used for the matcher plugins.

### addCustomApi

`function`
The entries are per app. That's why the key needs to be the id of an app.

```ts
	addCustomApi?: (args: {
		settings: ProjectSettings & ExternalSettings
	}) =>
		| Record<`app.${string}.${string}`, unknown>
		| { "app.inlang.ideExtension": CustomApiInlangIdeExtension }
```
