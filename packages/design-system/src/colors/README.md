# Color system

A tailwind plugin that leverages [tailwind colors](https://tailwindcss.com/docs/customizing-colors) to generate semantic color tokens.

The tokens are taken from Material Design 3. Take a look at the excellent documentation https://m3.material.io/styles/color/the-color-system/key-colors-tones. Material also provides a color schema generator https://m3.material.io/theme-builder#/custom.

## How to use

```js
// tailwind.config.js
const colors = require("@inlang/design-system/colors/tailwind-plugin");

module.exports = {
	content: ["<your content paths>"],
	theme: {},
	// optionally configure the colors. see [config](./types/config.cts)
	plugins: [colors.withConfig({})],
};
```

## FAQ

#### What benefit do color tokens provide?

TailwindCSS only provides utility classes. However, UI elements convey semantic meaning and hierarchy such as a "primary" or "secondary" button. Tailwind has no semantic classes such as "primary color". Color tokens are exactly that, semantic classes for colors.

#### Why has Material 3 been chosen as the reference?

The tokens and documentation just make sense. Probably, because the material team learned a lot through V1 and V2 of the material design system.
