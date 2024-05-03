# What does this rule do?

Enforces that all message ids are valid JavaScript identifiers. It also excludes any reserved JS keywords.
You can read more about valid JS identifiers [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers).

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
		"messageLintRule.inlang.validJsIdentifier": "error",
	}
}
```

The default level is `warning`