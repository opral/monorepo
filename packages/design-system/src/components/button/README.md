The button component is an exemplary implementation of the [design principles](../../../README.md).

### Files

- [index](./index.ts) The web component.
- [style](./style.cts) The style that is identical across all variants.
- [style.{variant}](./style.fill.cts) A variant of the style. The resulting class syntax is
  `{element}-{variant}-{color}` e.g. `button-fill-primary`.

### Limitations

In a nutshell, the shadow dom.

To use `<slot>`'s, the Shadow DOM is required. The shadow DOM's purpose is to isolate CSS. Exactly the opposite of the goal of this design system. The result are hacky workarounds to propagate the style regardless of the Shadow DOM. One of the workarounds is to load the host's stylesheet in each component. The workaround works surprisingly well (browsers cache the stylesheet).
