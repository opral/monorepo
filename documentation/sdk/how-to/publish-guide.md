# Publish your first guide

A guide, instead of an app or module inside of the marketplace, is a piece of content specifically designed to help users with a specific task. Guides are written in markdown and can contain custom web components to make them more interactive.

`Please store your guide inside of a git repo.`

## Pre-requisites

- [jsdelivr URL](https://www.jsdelivr.com/github) (other CDN's are not supported)

## Step-by-step

### 1. Add the information to your marketplace manifest
Adding the marketplace information is necessary for the marketplace to display your guide correctly.

| Parameter        | Description                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | Unique identifier for your guide.                         |
| `icon`        | Link to the icon of your guide (optional).              |
| `displayName`        | A user-friendly display name for your guide.              |
| `description`        | Briefly describe what your guide is about.              |
| `readme`             | Link to the guide as markdown file.          |
| `keywords`           | Keywords that describe your guide.                        |
| `publisherName`      | Your publisher name.                                          |
| `publisherIcon`      | Link to your publisher's icon or avatar (optional).           |
| `license`            | The license under which your app is distributed.       |

#### Official JSON schema

You can ensure that your manifest is valid by loading the following schema. 

``` json
"$schema": "https://inlang.com/schema/marketplace-manifest"
```

#### Naming your guide
| **Parameter**        | **Convention**                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | The unique identifier should always be written in camelCase like this: `camelCase.camelCase.camelCase`                         |
| `displayName`                 | Please follow the [Apple Style Guide](https://support.apple.com/de-de/guide/applestyleguide/apsgb744e4a3/web) and write the first letter of a new word in the title always in uppercase, e.g. [Language Tag](/m/8y8sxj09/library-inlang-languageTag). **Rule of thumb:** The first letter of the first word always has to be uppercase, except your displayName is a name written in lowercase letters everywhere else like `npm` for example.                       |
| `description`                 | Please make sure to describe your guide as simple as possible. It is best practice to write 100 to 200 characters.                         |
`readme`                 | The readme acts as documentation for your guide and is written in markdown. Feel free to use github flavored markdown, additionally you use inlang's custom web components (doc-elements).                      |
`keywords`                 | Keywords are always written in lowercase e.g. `i18n`, `adoptable` …                          |

#### Custom web components

| Element        | Attribute   | Description                                                | Required |
|----------------|-------------|------------------------------------------------------------|----------|
| `<doc-figure>` | src         | Source to the image file.                                  | Yes      |
|                | alt         | Alternative text for screen readers.                       | Yes      |
|                | caption     | Caption shown below the image.                             | Yes      |
| `<doc-icon>`   | icon        | [Iconify](https://icon-sets.iconify.design/) icon tag.     | Yes      |
|                | size        | The size of the icon.                                      | Yes      |
| `<doc-link>`   | title       | The title for the document link.                           | Yes      |
|                | icon        | [Iconify](https://icon-sets.iconify.design/) icon tag.     | Yes      |
|                | href        | The link behind the document link.                         | Yes      |
|                | description | The description shown in the quick link.                   | Yes      |

This format reduces repetition by listing common attributes for each element under the respective element's section.

### 2. Add the link to your marketplace manifest to the registry

Add the raw link of your manifest to [this file](https://github.com/opral/monorepo/blob/main/inlang/source-code/marketplace-registry/registry.json). You can fork the repository to do so.

### 3. Create a pull request and wait for approval

Create a pull request with your changes and wait for approval from our team. Usually, this will take less than 24 hours. After that, your guide will be available on the inlang website.

Feel free to [join our Discord](https://discord.gg/CNPfhWpcAa) if you have any questions or need help with publishing your guide.
