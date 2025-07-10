# Styling the Diff Output

The diff renderer uses semantic CSS classes to style changes based on the operation performed:

- `.diff-created` — applied to newly added elements
- `.diff-updated` — applied to modified elements  
- `.diff-deleted` — applied to removed elements

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
.diff-created {
  color: green;
  text-decoration: none;
  outline: none;
}
.diff-updated {
  color: orange;
  text-decoration: none;
  outline: none;
}
.diff-deleted {
  color: red;
  text-decoration: none;
  outline: none;
}
```

## Custom Styling

You can override these styles in your own CSS for custom themes or branding:

```css
.diff-created {
  color: #080;
  background: #efe;
}
.diff-updated {
  color: #f60;
  background: #ffc;
}
.diff-deleted {
  color: #b00;
  background: #fee;
}
```

## Legacy Before/After Style

If you prefer the traditional before/after styling, you can achieve it with:

```css
.diff-created, .diff-updated {
  color: green;
}
.diff-deleted {
  color: red;
}
```

## Merging with Existing Classes

If your original elements have classes, the diff classes will be merged (e.g. `<p class="foo diff-created">`). This allows you to maintain your existing styling while adding diff-specific styles.