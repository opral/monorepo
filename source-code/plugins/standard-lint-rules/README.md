# @inlang/standard-lint-rules

High-quality lint rules maintained by inlang.

This repository contains rules that the community agreed upon as "standard rules". Read more about inlang's lint system [here](https://inlang.com/documentation/lint).

## Usage

You can add any rule to the config like this:

_inlang.config.js_

```ts
export async function defineConfig(env) {
	// import the rules you want to use
	const { default: standardLintRules } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js",
	)

	return {
		// ...
		plugins: [
			// other plugins...
			standardLintRules(),
		],
	}
}
```

Optionally, you can adjust the lint level of each rule or disable rules alltogether:

```ts
standardLintRules({
	// disable a rule
	missingMessage: "off",
	// adjust the lint level of a rule
	identicalPattern: "warning",
})
```

## Rules

Are you missing a rule? Create a PR or add a comment [in the discussion thread](https://github.com/inlang/inlang/discussions/406).

### missingMessage

Checks for missing messages (translations).

If a message exists in the reference resource but is missing in a target resource. Likely, the message has not been translated yet.

#### Example

#### Example

```ts
REFERENCE RESOURCE (FOR EXAMPLE EN)
{
  "login": "Hello to this app",
  "cancel": "Cancel this action",
}
```

```ts
TRANSLATION RESOURCE (FOR EXAMPLE DE)
{
  "login": "Hallo zu dieser App",
}
```

```
Error: The Message with ID 'cancel' does not exist in the target resource DE.
```

### messageWithoutReference

Checks for likely outdated messages (translations).

A message with a missing reference is usually an indication that the message (id) is no longer used in the source code, but resources have not been updated accordingly.

#### Example

```ts
REFERENCE RESOURCE (FOR EXAMPLE EN)
{
  "login": "Hello to this app",
  "cancel": "Cancel this action",
}
```

```ts
TRANSLATION RESOURCE (FOR EXAMPLE DE)
{
  "login": "Hallo zu dieser App",
  "cancel": "Abbrechen",
  "continue": "Fortfahren"
}
```

```
Error: The Message with ID 'continue' does not exist in the reference Resource.
```

### identicalPattern

Checks for identical patterns in different languages.

A message with identical wording in multiple languages can indicate
that the translations are redundant or can be combined into a single
message to reduce translation effort.

```ts
REFERENCE RESOURCE (FOR EXAMPLE EN)
{
  "greeting": "Hello",
  "welcome": "Welcome to our website"
}
```

```ts
TRANSLATION RESOURCE (FOR EXAMPLE DE)
{
  "greeting": "Hello",
  "welcome": "Willkommen auf unserer Webseite"
}
```

```
Warning: Identical message 'Hello' found in language 'de' with message ID 'greeting'.
```
