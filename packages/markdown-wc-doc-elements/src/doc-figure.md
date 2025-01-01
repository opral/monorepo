---
imports:
  - "../dist/doc-figure.js"
---

### doc-figure

The `<doc-figure>` element is used to display an image with a caption. 

#### Attributes

- `src`: The URL of the image to display.
- `alt`: The alternative text for the image.
- `caption`: The caption to display below the image.

#### Example

```html
<doc-figure 
  src="https://my-image-url.com/image.png" 
  alt="Go global mockups" 
  caption="This is a caption for the image.">
</doc-figure>
```

<doc-figure 
  src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/go-global-mockup02.png" 
  alt="Inlang ecosystem" 
  caption="Globalization/localization of software requires adjustments from design to development to translation.">
</doc-figure>