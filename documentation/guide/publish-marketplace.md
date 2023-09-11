---
title: Publish to the marketplace
href: /documentation/publish-marketplace
description: Reach more of your target audience by publishing your app, plugin, or lint rule to the marketplace.
---

# {% $frontmatter.title %}

Publishing your own plugin or lint rule to the [marketplace](/marketplace) is straightforward, as the only thing you have to add to our item registry is the URL of your `marketplace-manifest.json`.

## Pre-requisites

- [jsdelivr URL](https://www.jsdelivr.com/github) (other CDN's are not supported)
- A developed [app](/documentation/develop-app), [plugin](/documentation/develop-plugin), or [lint rule](/documentation/develop-lint-rule)

## Step-by-step

### 1. Add the information to your marketplace manifest
Adding the marketplace information is necessary for the marketplace to display your item correctly. You can use these category-specific templates:
- [Manifest template for apps](/documentation/develop-app#4.-configure-your-app)
- [Manifest template for lint rules](/documentation/develop-lint-rule#3.-configure-your-lint-rule)
- [Manifest template for plugins](/documentation/develop-plugin#3.-configure-your-plugin)

#### Official JSON schema

You can ensure that your manifest is valid by loading the following schema. 

``` json
"$schema": "https://inlang.com/schema/marketplace-manifest"
```

#### Naming your item
| **Parameter**        | **Convention**                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | The unique identifier should always be written in camelCase like this: `camelCase.camelCase.camelCase`                         |
| `displayName`                 | Please follow the [Apple Style Guide](https://support.apple.com/de-de/guide/applestyleguide/apsgb744e4a3/web) and write the first letter of a new word in the title always in uppercase, e.g. `Language Tag`. **Rule of thumb:** The first letter of the first word always has to be uppercase, except your displayName is a name written in lowercase letters everywhere else like `npm` for example.                       |
| `description`                 | Please make sure to describe your item as simple as possible. It is best practice to write 100 to 200 characters.                         |
`readme`                 | The readme acts as documentation for your item and is written in markdown.                         |
`keywords`                 | Keywords are always written in lowercase e.g. `i18n`, `adoptable` …                          |

### 2. Add the link to your marketplace manifest to the registry

Add the raw link of your manifest to [this file](https://github.com/inlang/monorepo/blob/main/inlang/source-code/marketplace-registry/registry.json). You can fork the repository to do so.

### 3. Create a pull request and wait for approval

Create a pull request with your changes and wait for approval from our team. Usually, this will take less than 24 hours. After that, your item will be available in the marketplace.

Feel free to [join our Discord](https://discord.gg/gdMPPWy57R) if you have any questions or need help with publishing your item.
