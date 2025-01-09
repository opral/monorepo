---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/doc-callout.js
---

# The easiest "storage" plugin for inlang

The Inlang Message Format is a simple storage plugin for the Inlang ecosystem. It allows you to store simple
messages in a JSON file per language.

You will have a JSON file for each of your languages. By default, they are in `./messages/{languageTag}.json`, although this can be moved (read [Configuration](#configuration)).

The message files contain key-value pairs of the message ID and the translation. You can add variables in your message by using curly braces.

```json
//messages/en.json
{
  "hello_world": "Hello World!",
  "greeting": "Good morning {name}!"
}

//messages/de.json
{	
  //the $schema key is automatically ignored
  "hello_world": "Hallo Welt!",
  "greeting": "Guten Tag {name}!"
}
```

## Variants (pluralization, gendering, A/B testing)

The message below will match the following conditions:

| Platform | User Gender | Message                                                                 |
|----------|-------------|-------------------------------------------------------------------------|
| android  | male        | {username} has to download the app on his phone from the Google Play Store. |
| ios      | female      | {username} has to download the app on her iPhone from the App Store.    |
| *        | *           | The person has to download the app.                                     |

```json
{
	"jojo_mountain_day": {
		"match": {
			"platform=android, userGender=male": "{username} has to download the app on his phone from the Google Play Store.",
			"platform=ios, userGender=female": "{username} has to download the app on her iPhone from the App Store.",
			"platform=*, userGender=*": "The person has to download the app."
		}
	}
}
```

Pluralization is also supported. You can define a variable in your message and then use it in the selector.

| Inputs  | Condition         | Message                |
|---------|-------------------|------------------------|
| count=1 | countPlural=one   | There is one cat.      |
| count>1 | countPlural=other | There are many cats.   |

<doc-callout type="tip">
  Read the `local countPlural = count: plural` syntax as "create a local variable `countPlural` that equals `plural(count)`".
</doc-callout>

```json
{
"some_happy_cat": {
    "declarations": ["input count", "local countPlural = count: plural"],
    "selectors": ["countPlural"],
    "match": {
      "countPlural=one": "There is one cat.",
      "countPlural=other": "There are many cats.",
    },
  }
}
```


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
