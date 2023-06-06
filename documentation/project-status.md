---
title: Project status
href: /documentation/project-status
description: How inlang is progressing on its journey.
---

# {% $frontmatter.title %}

**Inlang is in alpha. Breaking changes should be expected. The following mechanisms are in place to streamline breaking changes.**

{% Callout variant="info" %}
**No frequent breaking changes are expected for the AST and Config (excluding experimental).** Both the [AST](/documentation/ast) and [config](/documentation/config.md) schemas are purposely small and designed to be extended overtime with feedback and requirements from users without (foreseeable) breaking changes.
{% /Callout %}

### Experimental property in the config

Properties in the config that are expected to change frequently are nested under `experimental`. Definitions under experimental can change at any time and do not lead to a `MAJOR` version bump.

```ts
export async function config() {
	// ... code

	return {
		// ... other properties
		experimental: {
			// properties nested under experimental
			// are subject to breaking changes
		},
	}
}
```

{% Feedback /%}
