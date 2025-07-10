# Styling the Diff Output

The diff renderer uses semantic CSS classes to style changes based on the operation performed:

- `.diff-create` — applied to newly added elements
- `.diff-update` — applied to modified elements  
- `.diff-delete` — applied to removed elements

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
.diff-create {
  color: green;
  text-decoration: none;
  outline: none;
}
.diff-update {
  color: orange;
  text-decoration: none;
  outline: none;
}
.diff-delete {
  color: red;
  text-decoration: none;
  outline: none;
}
```

## Custom Styling

You can override these styles in your own CSS for custom themes or branding:

```css
.diff-create {
  color: #080;
  background: #efe;
}
.diff-update {
  color: #f60;
  background: #ffc;
}
.diff-delete {
  color: #b00;
  background: #fee;
}
```

## Legacy Before/After Style

If you prefer the traditional before/after styling, you can achieve it with:

```css
.diff-create, .diff-update {
  color: green;
}
.diff-delete {
  color: red;
}
```

## Merging with Existing Classes

If your original elements have classes, the diff classes will be merged (e.g. `<p class="foo diff-create">`). This allows you to maintain your existing styling while adding diff-specific styles.