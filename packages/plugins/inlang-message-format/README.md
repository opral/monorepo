---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/doc-callout.js
---

# The easiest "storage" plugin for inlang

The Inlang Message Format is a simple storage plugin for the Inlang ecosystem. It allows you to store simple
messages in a JSON file per language.

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

## Installation

Install the plugin in your Inlang Project by adding it to your `"modules"` in `project.inlang/settings.json`. You will also need to provide a `pathPattern` for the plugin.

```diff
// project.inlang/settings.json
{
  "modules" : [
+    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"
  ],
+ "plugin.inlang.messageFormat": {
+   "pathPattern": "./messages/{locale}.json"
+ }
}
```

## Configuration

Configuration happens in `project.inlang/settings.json` under the `"plugin.inlang.messageFormat"` key.

### `pathPattern`

The path pattern defines _where_ the plugin will be looking for your message files. The default is `./messages/{locale}.json`. The `{locale}` placeholder will be replaced with the language tag for each of your languages.

```json
// project.inlang/settings.json
{
  "modules": [ ... ],
  "plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{locale}.json"
	}
}
```

You can also define an array of paths. The last path in the array will take precedence over the previous ones. This is useful if you want to have a default message file that is overridden by a customer-specific file.

```json
// project.inlang/settings.json
{
  "modules": [ ... ],
  "plugin.inlang.messageFormat": {
    "pathPattern": ["./defaults/{locale}.json", "./customer1/{locale}.json"]
  }
}
```

## Messages

You can organize your messages in a nested structure for better organization of your translations. There are two types of messages:

### Simple Messages

<doc-callout type="info">
	Nesting is supported from v4 of the plugin and requires apps to use the inlang SDK v2 higher. 
</doc-callout>

Simple messages are string values, either directly at the root level or nested within objects:

```json
{
	"hello": "world",
	"navigation": {
		"home": "Home",
		"about": "About",
		"contact": {
			"email": "Email",
			"phone": "Phone"
		}
	}
}
```

### Complex Messages (with variants, pluralization, etc.)

For complex messages with variants, wrap the message object in an array to differentiate it from nested simple messages:

```json
{
	"simple": "This is a simple message",
  "count": [
    {
      "declarations": ["input count", "local countPlural = count: plural"],
      "selectors": ["countPlural"],
      "match": {
        "countPlural=one": "There is one item",
        "countPlural=other": "There are {count} items"
      }
    }
  ]
}
```

When accessing this complex message, use dot notation: `navigation.items.count`

<doc-callout type="info">
The array wrapper is how we distinguish between a nested object containing more messages vs. a complex message object with variants.
</doc-callout>

## Variants (pluralization, gendering, A/B testing)

The message below will match the following conditions:

| Platform | User Gender | Message                                                                     |
| -------- | ----------- | --------------------------------------------------------------------------- |
| android  | male        | {username} has to download the app on his phone from the Google Play Store. |
| ios      | female      | {username} has to download the app on her iPhone from the App Store.        |
| \*       | \*          | The person has to download the app.                                         |

```json
{
	"jojo_mountain_day": [
		{
			"match": {
				"platform=android, userGender=male": "{username} has to download the app on his phone from the Google Play Store.",
				"platform=ios, userGender=female": "{username} has to download the app on her iPhone from the App Store.",
				"platform=*, userGender=*": "The person has to download the app."
			}
		}
	]
}
```

Pluralization is also supported. You can define a variable in your message and then use it in the selector.

| Inputs  | Condition         | Message              |
| ------- | ----------------- | -------------------- |
| count=1 | countPlural=one   | There is one cat.    |
| count>1 | countPlural=other | There are many cats. |

<doc-callout type="tip">
Read the `local countPlural = count: plural` syntax as "create a local variable `countPlural` that equals `plural(count)`".
</doc-callout>

```json
{
	"some_happy_cat": [
		{
			"declarations": ["input count", "local countPlural = count: plural"],
			"selectors": ["countPlural"],
			"match": {
				"countPlural=one": "There is one cat.",
				"countPlural=other": "There are many cats."
			}
		}
	]
}
```
