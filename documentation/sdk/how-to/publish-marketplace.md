# Publish to the marketplace

Publishing your own plugin or lint rule to the [marketplace](/) is straightforward, as the only thing you have to add to our item registry is the URL of your `marketplace-manifest.json`.

## Pre-requisites

- [jsdelivr URL](https://www.jsdelivr.com/github) (other CDN's are not supported)
- A developed [app](/documentation/build-app), [plugin](/documentation/plugin/guide), or [lint rule](/documentation/lint-rule)

## Step-by-step

### 1. Add the information to your marketplace manifest
Adding the marketplace information is necessary for the marketplace to display your item correctly. You can use these category-specific templates:
- [Manifest template for apps](/documentation/build-app#4-configure-your-app)
- [Manifest template for lint rules](/documentation/lint-rule/guide#3-configure-your-lint-rule)
- [Manifest template for plugins](/documentation/plugin/guide#3-configure-your-plugin)

#### Official JSON schema

You can ensure that your manifest is valid by loading the following schema. 

``` json
"$schema": "https://inlang.com/schema/marketplace-manifest"
```

#### Naming your item
| Parameter        | Convention                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | The unique identifier should always be written in camelCase like this: `camelCase.camelCase.camelCase`                         |
| `displayName`                 | Please follow the [Apple Style Guide](https://support.apple.com/de-de/guide/applestyleguide/apsgb744e4a3/web) and write the first letter of a new word in the title always in uppercase, e.g. [Language Tag](/m/8y8sxj09/library-inlang-languageTag). **Rule of thumb:** The first letter of the first word always has to be uppercase, except your displayName is a name written in lowercase letters everywhere else like `npm` for example.                       |
| `description`                 | Please make sure to describe your item as simple as possible. It is best practice to write 100 to 200 characters.                         |
`readme`                 | The readme acts as documentation for your item and is written in markdown. Feel free to use github flavored markdown, additionally you use inlang's custom web components (doc-elements).                      |
`keywords`                 | Keywords are always written in lowercase e.g. `i18n`, `adoptable` …                          |

### 2. Writing your readme

#### ❗ Please note

It is completely up to you how you want to style your product pages. This is just an inspiration for you to get started.

#### How we at inlang style product pages

We are using an engaging header image with up to three key features of the product. If it is important to the product, we introduce a `Getting started` section beforehand. 

![How we style product pages at inlang](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/styleguide-mockup.svg)

Of course styling product pages can change from time to time. If you have any questions regarding this, please reach out to us on [Discord](https://discord.com/invite/gdMPPWy57R).

### 3. Add the link to your marketplace manifest to the registry

Please note that you need to include a key of a 8 character long random string. You can generate one [here](https://passwordsgenerator.net/). Allowed are numbers and lowercase letters. This key is necessary for the marketplace to identify your item.

If you are publishing an app, plugin or lint rule, you can add your product to the "m" category.

Add the raw link of your manifest to [this file](https://github.com/opral/monorepo/blob/main/inlang/source-code/marketplace-registry/registry.json). You can fork the repository to do so.

### 4. Create a pull request and wait for approval

Create a pull request with your changes and wait for approval from our team. Usually, this will take less than 24 hours. After that, your item will be available in the marketplace.

Feel free to [join our Discord](https://discord.gg/CNPfhWpcAa) if you have any questions or need help with publishing your item.

## Markdown assets

### inlang ecosystem compatible badge

Please use this badge in your `README.md` to show the your contributor that your software is inlang ecosystem compatible.

```md
[![badge](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/assets/md-badges/inlang.svg)](https://inlang.com)
```

##### Preview

[![badge](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/assets/md-badges/inlang.svg)](https://inlang.com)

---

### Custom web components

#### `<doc-figure>`

The `<doc-figure>` element is used to display images in the readme. It is a wrapper around the `<figure>` element and has the same attributes. 

Attributes:
- `src` (required): The source to the image file.
- `alt` (required): Alternative text for screen readers.
- `caption` (required): Caption shown below the image.

```md
<doc-figure src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg" alt="inlang ecosystem" caption="The inlang ecosystem"></doc-figure>
```

##### Preview
<doc-figure src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg" alt="inlang ecosystem" caption="The inlang ecosystem"></doc-figure>

---

#### `<doc-icon>`
The `<doc-icon>` element is used to display icons in the readme.

Attributes:
- `icon` (required): [Iconify](https://icon-sets.iconify.design/) icon tag.
- `size` (required): The size of the icon.

```md
<doc-icon icon="mdi:github" size="1.5em"></doc-icon>
```

##### Preview
<doc-icon icon="mdi:github" size="1.5em"></doc-icon>

---

#### `<doc-link>`
The `<doc-link>` element is used to display links in a more converting way inside of the readme.

Attributes:
- `title` (required): The title for the document link.
- `icon` (required): [Iconify](https://icon-sets.iconify.design/) icon tag.
- `href` (required): The link behind the document link.
- `description` (required): The description shown in the quick link.

```md
<doc-link title="Documentation" icon="mdi:book-open-page-variant" href="https://inlang.com/documentation" description="Read the documentation"></doc-link>
```

##### Preview
<doc-link title="Documentation" icon="mdi:book-open-page-variant" href="https://inlang.com/documentation" description="Read the documentation"></doc-link>

---

#### `<doc-slider>`
The `<doc-slider>` element is used to display a slider with images in the readme. As arrays are not supported in markdown, you have to separate the images with a comma.

Attributes:
- `items` (required): The images being shown in the slider.
- `looping` (optional): True if you want the slider to loop.

```md
<doc-slider items="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg, https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg, https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg"></doc-slider>
```

##### Preview
<doc-slider items="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg, https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg, https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg"></doc-slider>

---

#### `<doc-feature>`
The `<doc-feature>` element is used to display a feature in the readme.

Attributes:
- `title` (required): The title of the feature.
- `icon` (optional): Show an icon from [Iconify](https://icon-sets.iconify.design/).
- `image` (optional): Show an image (you can only show an image **or** an icon).
- `color` (optional): The background color of the feature.
- `text-color` (optional): The text color of the feature.

```md
<doc-feature title="Feature" icon="mdi:github" color="#E5E8EB"></doc-feature>
```

##### Preview
<doc-feature title="Feature" icon="mdi:github" color="#E5E8EB"></doc-feature>

---

#### `<doc-accordion>`
The `<doc-accordion>` element is used to display content in an expandable accordion, which is useful e.g. for FAQs.

Attributes:
- `heading` (required): The heading of the accordion.
- `text` (required): The content of the accordion.

```md
<doc-accordion heading="Question" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam quis aliquam ultricies, nisl nunc ultricies nunc, vitae ultrices nisl nunc eu nunc."></doc-accordion>
```

##### Preview
<doc-accordion heading="Question" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam quis aliquam ultricies, nisl nunc ultricies nunc, vitae ultrices nisl nunc eu nunc."></doc-accordion>


