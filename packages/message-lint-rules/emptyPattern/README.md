# What does this rule do?

Checks for empty pattern in a [language tag](https://inlang.com/m/8y8sxj09/library-inlang-languageTag). If a message exists in the reference resource but the pattern in a target resource is empty, it is likely that the message has not been translated yet.

## Manual setup

Besides installing the lint rule through `manage.inlang.com` you could also configure it manually.

### Settings

Type:
```ts
type MessageLintRuleLevel = "error" | "warning"
```

Example in the `project.inlang/settings.json`:
```json
{
    // other configuration
    "messageLintRuleLevels": {
		"messageLintRule.inlang.emptyPattern": "error",
	}
}
```

The default level is `warning`
