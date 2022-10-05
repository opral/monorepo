# @inlang/design-system

Unstyled web components with configurable style on option.

Like https://www.radix-ui.com/ but with class components like https://daisyui.com/components/button/. What's the benefit of combining web components + RadixUI + daisyUI?
Unstyled components that work everywhere (React, Svelte, Vue, even markdown!) that are accessible, themeable

## Design principles

- **Unstyled by default**  
  Other teams can leverage the web components to build their design systems.
  Similar to [Radix UI](https://www.radix-ui.com/) (but with web components that work everywhere).

- **Styled as an option**
  To get going quickly, styles can be applied to components. The prototype currently
  leverages a TailwindCSS plugin to export classes that apply the style.

  ```html
  <in-button>Unstyled</in-button>
  <in-button class="button-primary">Styled</in-button>
  ```

- **Styled as an option is highly themeable**  
   The CSS is dynamically generated based on the [component tailwind plugin](./src/components/tailwindPlugin.cts). Therefore, color tokens can be defined dynamically. Furthermore,
  pre-styled components usually define individual design tokens for spacing and more. This design system is supposed to use Tailwind design tokens, leading to the ability to use
  TailwindCSS (and not having different spacings of own UI elements and component elements).

  Using TailwindCSS tokens allows additional themeability. For example, the host might define `p-2` as `0.75rem` instead of the default `0.5rem` in their tailwind config. The design system
  inherits the change, leading to easy themability and consistency across the UI.

## FAQ

**Why has this been developed?**

No high-quality unstyled/themeable component libraries like [Radix](https://www.radix-ui.com/) or [HeadlessUI](https://headlessui.com/) exist that are framework agnostic, even though web components have been standardized. [Shoelace](https://shoelace.style/) was a contester but the color tokens are hard-coded. Tailwind itself has no components at all and lacks a [semantic color system](https://m3.material.io/styles/color/overview). A semantic color system leads to a consistent UI and seamless dark mode. (The `dark:` modifier in tailwind is unnecessary
if a semantic color system is used.)

**Why are components beneficial?**

Maintaining TailwindCSS without components leads to inconsistencies and is hard to read.
Tailwind plugins like [DaisyUI](https://daisyui.com/) create component CSS classes. But,
as the Tailwind maintainers themselves declare:

> Unless a component is a single HTML element, the information needed to define it can’t be captured in CSS alone. For anything even remotely complex, the HTML structure is just as important as the CSS.  
> _https://tailwindcss.com/docs/reusing-styles#compared-to-css-abstractions_

This design system aims at combining the theme ability of DaisyUI with the functionality of a real component.

**What are those `.cjs` and `.cts` files in the source code?**

[Tailwind's](https://tailwindcss.com/) config uses CommonJS instead of ES Module. Read more about
CommonJS and ESM [here](https://dev.to/iggredible/what-the-heck-are-cjs-amd-umd-and-esm-ikm).

## Design decisions

### Using the Shadow DOM

Web components are a set of features. One of them is defining custom HTML elements like `<in-button></in-button />`. Another one is `<slot>`'s. And, last but not least, the [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM).

Slots allow the nesting of HTML elements, "similar" to component frameworks like React:

```html
<sl-button>
	<sl-icon slot="prefix" name="gear"></sl-icon>
	Settings
</sl-button>
```

The Shadow DOM encapsulates the styling, similar to [CSS Modules](https://vitejs.dev/guide/features.html#css-modules) in component frameworks. The style defined in a component only applies to the component.

Unfortunately, slots and the Shadow DOM only work in combination. The Shadow DOM is exactly the
opposite of this design-systems requirement of inheriting (tailwind) styles from the host. Experiments of deactivating the Shadow DOM led to the desired effect of inheriting styles but giving up on slots
was not an option. To achieve the desired effect of inheriting styles, regardless of the Shadow DOM, a workaround has been developed. See [Inheriting styles from the host](#inheriting-styles-from-the-host).

_Further reading:_

- https://github.com/lit/lit-element/issues/553
