---
title: Publish to the marketplace
href: /documentation/publish-marketplace
description: Reach more of your target audience by publishing your app, plugin, or lint rule to the marketplace.
---

# {% $frontmatter.title %}

Publishing your own plugin or lint rule to the [marketplace](/marketplace) is straightforward, as the only thing you have to add to our item registry is the URL of your `marketplace-manifest.json`.

## Pre-requisites

- [jsdelivr URL](https://www.jsdelivr.com/github) (other CDN's are not supported)

## Step-by-step

### 1. Add the information to your marketplace manifest
Adding the marketplace information is necessary for the marketplace to display your item correctly. You can use this template to do that:

```json
{
	"id": "type.publisher_name.item_name",
	"icon": "Link to items icon (not required)",
	"displayName": {
		"en": "english display name"
	},
	"description": {
		"en": "english description"
	},
	"readme": {
		"en": "raw markdown readme"
	},
	"keywords": ["keyword1", "keyword2"],
	"publisherName": "your publisher name",
	"publisherIcon": "Link to your icon / avatar (not required)",
	"license": "Apache-2.0"
}

```

### 2. Add the link to your marketplace manifest to the registry

Add the raw link of your manifest to [this file](https://github.com/inlang/inlang/blob/main/source-code/marketplace/registry.json). You can fork the repository to do so.

### 3. Create a pull request and wait for approval

Create a pull request with your changes and wait for approval from our team. Usually, this will take less than 24 hours. After that, your item will be available in the marketplace.

Feel free to [join our Discord](https://discord.gg/gdMPPWy57R) if you have any questions or need help with publishing your item.
