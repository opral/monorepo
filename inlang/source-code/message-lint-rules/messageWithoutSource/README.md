# What does this rule do?

Checks for likely outdated messages.  A message with a missing source is usually an indication that the message (id) is no longer used in source code, but messages have not been updated accordingly.

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
		"messageLintRule.inlang.messageWithoutSource": "error",
	}
}
```

The default level is `warning`