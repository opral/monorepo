# What does this rule do?

Checks for missing variants for a specific languageTag.  If a variant exists for the sourceLanguageTag but is missing for a listed languageTag, it is likely that the message has not been translated for this languageTag yet.

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
		"messageLintRule.inlang.missingTranslation": "error",
	}
}
```

The default level is `warning`