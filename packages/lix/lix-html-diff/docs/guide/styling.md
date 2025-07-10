# Styling the Diff Output

The diff renderer uses semantic CSS classes to style changes:

- `.diff-before` — applied to elements representing removed or old content
- `.diff-after` — applied to elements representing added or new content

## Default Styles

A default stylesheet is provided with the package:

```js
import "@lix-js/html-diff/default.css";
```

Or, add it to your HTML:

```html
<link rel="stylesheet" href="/node_modules/@lix-js/html-diff/default.css" />
```

This file provides sensible defaults:

```css
.diff-before {
  color: red;
  text-decoration: none;
  outline: none;
}
.diff-after {
  color: green;
  text-decoration: none;
  outline: none;
}
```

## Custom Styling

You can override these styles in your own CSS for custom themes or branding:

```css
.diff-before {
  color: #b00;
  background: #fee;
}
.diff-after {
  color: #080;
  background: #efe;
}
```

## Merging with Existing Classes

If your original elements have classes, the diff classes will be merged (e.g. `<p class="foo diff-after">`). This allows you to maintain your existing styling while adding diff-specific styles.