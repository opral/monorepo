# The easiest "storage" plugin for inlang

The Inlang Message Format is a simple storage plugin for the Inlang ecosystem. It allows you to store simple
messages in a JSON file per language.

You will have a JSON file for each of your languages. By default, they are in `./messages/{languageTag}.json`, although this can be moved (read [Configuration](#configuration)).

The message files contain key-value pairs of the message ID and the translation. You can add variables in your message by using curly braces.

```json
//messages/en.json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "hello_world": "Hello World!",
  "greeting": "Good morning {name}!"
}

//messages/de.json
{	
  //the $schema key is automatically ignored
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "hello_world": "Hallo Welt!",
  "greeting": "Guten Tag {name}!"
}
```

Advanced formatting such as Plurals, Formatting functions, and Markup Interpolation are currently not supported, but they are planned.

Nesting is not supported and likely won't be.

## Installation

If you used an init CLI to create your Inlang project, most likely, this plugin is already installed.

Otherwise, you can install it in your Inlang Project by adding it to your `"modules"` in `project.inlang/settings.json`. You will also need to provide a `pathPattern` for the plugin.

```diff
// project.inlang/settings.json
{
  "modules" : [
+    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
  ],
+ "plugin.inlang.messageFormat": {
+   "pathPattern": "./messages/{languageTag}.json" 
+ }
}
```

## Configuration

Configuration happens in `project.inlang/settings.json` under the `"plugin.inlang.messageFormat"` key.

### Moving the Message Files using `pathPattern`

The path pattern defines _where_ the plugin will be looking for your message files. The default is `./messages/{languageTag}.json`. It's a relative path that's resolved from your package root.

The `{languageTag}` placeholder will be replaced with the language tag for each of your languages. 

```json
// project.inlang/settings.json
{
  "modules": [ ... ],
  "plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{languageTag}.json"
	}
}
```
