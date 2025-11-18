# Styling the Diff

## Your App's CSS is Preserved

Your app's existing CSS continues to work exactly as before.

When you render a diff using Lix HTML Diff, it only adds `data-diff-status` attributes to highlight changes. It does not modify your existing HTML structure or styling. The exception is when you opt in to specific behaviors using [data-diff-mode](/guide/attributes.html#data-diff-mode) attributes, which allows for more control over how diffs are displayed.

Each changed element receives one of these attributes:

- `data-diff-status="added"` — applied to newly added elements
- `data-diff-status="modified"` — applied to modified elements
- `data-diff-status="removed"` — applied to removed elements

### Example: Your Styling is Preserved

```html
<!-- Your original component -->
<button class="primary-btn large-size" id="submit-btn" data-diff-key="btn1">
  Submit Order
</button>

<!-- After diff processing (text changed) -->
<button
  class="primary-btn large-size"
  id="submit-btn"
  data-diff-key="btn1"
  data-diff-status="modified"
>
  Complete Purchase
</button>
```

Notice how:

- Your `primary-btn` and `large-size` classes remain untouched
- Your `id` and `data-diff-key` attributes are preserved
- Only `data-diff-status="modified"` was added to highlight the change
- All your existing CSS for `.primary-btn` and `.large-size` continues to work

## Default Styles

A default stylesheet is provided with the package:

```js
import "@lix-js/html-diff/default.css";
```

Or, add it to your HTML:

```html
<link rel="stylesheet" href="/node_modules/@lix-js/html-diff/default.css" />
```

## Custom Styling

You can override these styles in your own CSS for custom themes or branding:

```css
[data-diff-status="added"] {
  color: #080;
  background: #efe;
}
[data-diff-status="modified"] {
  color: #f60;
  background: #ffc;
}
[data-diff-status="removed"] {
  color: #b00;
  background: #fee;
}
```

## Styling Strategy

Because diff metadata is attached via `data-diff-status`, your components keep their original classes intact. You simply target the attribute in CSS:

```html
<!-- Original -->
<div class="card featured">Content</div>

<!-- After diff (added) -->
<div class="card featured" data-diff-status="added">Content</div>

<!-- After diff (modified) -->
<div class="card featured" data-diff-status="modified">Content</div>
```

You can now scope your override styles with attribute selectors without worrying about class ordering.

### CSS Specificity Tips

Attribute selectors have the same specificity as classes, so you can rely on normal cascade rules:

```css
/* Your existing styles work as normal */
.card {
  padding: 20px;
  border: 1px solid #ccc;
}
.featured {
  border-color: gold;
}

/* Diff styles override conflicting properties */
[data-diff-status="modified"] {
  color: orange;
} /* This color wins */
[data-diff-status="added"] {
  color: green;
} /* This color wins */
[data-diff-status="removed"] {
  color: red;
} /* This color wins */
```

This ensures your app's layout and design remain intact while only the diff highlighting is added on top.
