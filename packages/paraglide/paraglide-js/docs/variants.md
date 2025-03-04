---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/doc-callout.js

---

# Variants

Variants enable pluralization, gendering, A/B testing, and more. They are a powerful feature of inlang that allows you to create different versions of a message based on conditions. 

## Matching

The message below will match the following conditions:

| Platform | User Gender | Message                                                                 |
|----------|-------------|-------------------------------------------------------------------------|
| android  | male        | {username} has to download the app on his phone from the Google Play Store. |
| ios      | female      | {username} has to download the app on her iPhone from the App Store.    |
| *        | *           | The person has to download the app.                                     |

<doc-callout type="info">
  The example below uses the inlang message format plugin for illustrative purposes. The syntax may differ depending on the plugin you are using.
</doc-callout>

```json
{
	"jojo_mountain_day": [{
		"match": {
			"platform=android, userGender=male": "{username} has to download the app on his phone from the Google Play Store.",
			"platform=ios, userGender=female": "{username} has to download the app on her iPhone from the App Store.",
			"platform=*, userGender=*": "The person has to download the app."
		}
	}]
}
```

## Pluralization

You can define a variable in your message and then use it in the selector. Paraglide uses `Intl.PluralRules` under the hood to determine the plural form. 

| Inputs  | Condition         | Message                |
|---------|-------------------|------------------------|
| count=1 | countPlural=one   | There is one cat.      |
| count>1 | countPlural=other | There are many cats.   |

<doc-callout type="tip">
  Read the `local countPlural = count: plural` syntax as "create a local variable `countPlural` that equals `plural(count)`".
</doc-callout>

```json
{
"some_happy_cat": [{
    "declarations": ["input count", "local countPlural = count: plural"],
    "selectors": ["countPlural"],
    "match": {
      "countPlural=one": "There is one cat.",
      "countPlural=other": "There are many cats.",
    },
  }]
}
```