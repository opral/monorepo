---
title: Breaking changes
href: /documentation/breaking-changes
description: How inlang deals with breaking changes during alpha/beta.
---

# {% $frontmatter.title %}

**Inlang is in alpha. Breaking changes should be expected. Two mechanisms are in place to streamline breaking changes.**

{% Callout variant="info" %}
**Frequent breaking changes are not expected**. Inlang's public interface is small. In the majority of cases, only the [config](/documentation/config.md) schema is of relevance.
{% /Callout %}

### 1. Versioning (modified semantic versioning)

Inlang uses `0.MAJOR.MINOR|PATCH` during alpha/beta. For example, an update from `0.3.45 -> 0.4.0` contains a breaking change. `MINOR` and `PATCH` updates are aggregated e.g. `0.3.45 -> 0.3.46` can be a patch or minor update.

That pattern differs from semantic versioning. Semantic versioning defines a version as `MAJOR.MINOR.PATCH` e.g. `1.2.1`. `MAJOR` indicates breaking changes e.g. updating from `1.2.1 -> 2.0.0` contains breaking changes.

### 2. Experimental property in the config

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
	};
}
```
