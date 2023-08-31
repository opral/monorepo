---
title: Publish to the marketplace
href: /documentation/publish-marketplace
description: You can manually create a new project if inlang.com/new is not working for you.
---

# {% $frontmatter.title %}

Publishing your own plugin or lint rule to the [marketplace](/marketplace) is straight forward, as the only thing you have to add to our item registry, is the URL of your package.

## Pre-requisites

- [jsdelivr URL](http://localhost:3000/documentation/publish-marketplace#pre-requisites) (other CDN's are not supported)

## Step-by-step

### 1. Add the necessary marketplace property to your plugin or lint-rule.
Adding the marketplace information is necessary for the marketplace to display your item correctly.

```ts
meta: {
		// ...
		marketplace: {
			icon: // Optional: URL to your icon,
			linkToReadme: {
				en: // Link to your readme in English with markdown syntax,
			},
			keywords: [
                // An array of keywords that describe your package
            ],
			publisherName: // Your name or the name of your organization,
			publisherIcon: // Optional: URL to your icon or avatar,
			license: "Apache-2.0",
		},
        // ...
	},
```

### 2. Add the link to your plugin or lint-rule package to the registry

Add your package to [this file](https://github.com/inlang/inlang/blob/main/source-code/marketplace/registry.json). You can fork the repository for doing so.

### 3. Create a pull request and wait for approval

Create a pull request with your changes and wait for approval from our team. Usually, this will take less than 24 hours. After that, your plugin or lint rule will be available in the marketplace.

Feel free to [join our Discord](https://discord.gg/gdMPPWy57R) if you have any questions or need help with publishing your item.
