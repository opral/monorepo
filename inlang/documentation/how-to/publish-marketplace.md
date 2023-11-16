# Publish to the marketplace

Publishing your own plugin or lint rule to the [marketplace](/) is straightforward, as the only thing you have to add to our item registry is the URL of your `marketplace-manifest.json`.

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
| Parameter        | Convention                                               |
|----------------------|---------------------------------------------------------------|
| `id`                 | The unique identifier should always be written in camelCase like this: `camelCase.camelCase.camelCase`                         |
| `displayName`                 | Please follow the [Apple Style Guide](https://support.apple.com/de-de/guide/applestyleguide/apsgb744e4a3/web) and write the first letter of a new word in the title always in uppercase, e.g. `Language Tag`. **Rule of thumb:** The first letter of the first word always has to be uppercase, except your displayName is a name written in lowercase letters everywhere else like `npm` for example.                       |
| `description`                 | Please make sure to describe your item as simple as possible. It is best practice to write 100 to 200 characters.                         |
`readme`                 | The readme acts as documentation for your item and is written in markdown. Feel free to use github flavored markdown, additionally you use inlang's custom web components (doc-elements).                      |
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
| `<doc-slider>` | items       | The images being shown in the slider.                      | Yes      |
|                | looping     | True if you want the slider to loop.                       | No       |
| `<doc-feature>`| title       | The title of the feature.                                  | Yes      |
|                | icon        | Show an icon from [Iconify](https://icon-sets.iconify.design/).       | No       |
|                | image       | Show an image (you can only show an image **or** an icon). | No       |
|                | color       | The background color of the feature.                       | No       |
|                | text-color     | The text color of the feature.                          | No       |



This format reduces repetition by listing common attributes for each element under the respective element's section.

### 2. Add the link to your marketplace manifest to the registry

Please note that you need to include a key of a 8 character long random string. You can generate one [here](https://passwordsgenerator.net/). Allowed are numbers and lowercase letters. This key is necessary for the marketplace to identify your item.

If you are publishing an app, plugin or lint rule, you can add your product to the "m" category.

Add the raw link of your manifest to [this file](https://github.com/inlang/monorepo/blob/main/inlang/source-code/marketplace-registry/registry.json). You can fork the repository to do so.

### 3. Create a pull request and wait for approval

Create a pull request with your changes and wait for approval from our team. Usually, this will take less than 24 hours. After that, your item will be available in the marketplace.

Feel free to [join our Discord](https://discord.gg/gdMPPWy57R) if you have any questions or need help with publishing your item.
