# What does this rule do?

Checks for identical patterns in different languages.  A message with identical wording in multiple languages can indicate that the translations are redundant or can be combined into a single message to reduce translation effort.

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
		"messageLintRule.inlang.identicalPattern": "error",
	}
}
```

The default level is `warning`
