# Color system

A tailwind plugin that leverages [tailwind colors](https://tailwindcss.com/docs/customizing-colors) to generate semantic color tokens.

The tokens are taken from Material Design 3. Take a look at the excellent documentation https://m3.material.io/styles/color/the-color-system/key-colors-tones. Material also provides a color schema generator https://m3.material.io/theme-builder#/custom.

## Deviations from Material3

**No :drag colors; increased darkening of :press selector**

Material defines [4 interaction state colors](https://m3.material.io/foundations/interaction-states).
One of them is a drag state. However, CSS provides no drag selector. Furthermore, the press
darkening is identical to the hover darkening. The identical darkening leads to an unsatisfying
press experience where the colors don't change. To combat the drag and unsatisfying press experience,
the press selector has been darkened to the drag value.

The implemenation can be found in (./generateTokens.cts)[./generateTokens.cts].

## FAQ

#### What benefit do color tokens provide?

TailwindCSS only provides utility classes. However, UI elements convey semantic meaning and hierarchy such as a higher emphasized `Save` button and a lower emphasized `Discard` button. Tailwind has no semantic classes such as "primary color". Color tokens are exactly that, semantic classes for colors.

#### Why has Material 3 been chosen as the reference?

The tokens and documentation just make sense. Probably, because the material team learned a lot through V1 and V2 of the material design system.
