# Styling the Diff

## Your App's CSS is Preserved

Your app's existing CSS continues to work exactly as before.

When you render a diff using Lix HTML Diff, it only adds CSS classes to highlight changes. It does not modify your existing HTML structure or styling. The exception is when you opt-in to specific behaviors using [data-diff-mode](/guide/attributes.html#data-diff-mode) attributes, which allows for more control over how diffs are displayed.

The diff renderer uses semantic CSS classes to highlight changes:

- `.diff-added` — applied to newly added elements
- `.diff-modified` — applied to modified elements  
- `.diff-removed` — applied to removed elements

### Example: Your Styling is Preserved

```html
<!-- Your original component -->
<button class="primary-btn large-size" id="submit-btn" data-diff-key="btn1">
  Submit Order
</button>

<!-- After diff processing (text changed) -->
<button class="diff-modified primary-btn large-size" id="submit-btn" data-diff-key="btn1">
  Complete Purchase
</button>
```

Notice how:

- Your `primary-btn` and `large-size` classes remain untouched
- Your `id` and `data-diff-key` attributes are preserved  
- Only `diff-modified` was added to highlight the change
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
.diff-added {
  color: #080;
  background: #efe;
}
.diff-modified {
  color: #f60;
  background: #ffc;
}
.diff-removed {
  color: #b00;
  background: #fee;
}
```

## Class Merging Strategy

HTML diff uses a **prepend strategy** for CSS classes to ensure diff highlighting takes precedence while preserving your existing styles:

```html
<!-- Original -->
<div class="card featured">Content</div>

<!-- After diff (added) -->
<div class="diff-added card featured">Content</div>

<!-- After diff (modified) -->  
<div class="diff-modified card featured">Content</div>
```

**Why prepend?** Diff classes are added first so they can override conflicting styles (like color) while your layout classes (like `card`, `featured`) continue to work.

### CSS Specificity Tips

Since diff classes are prepended, you can rely on CSS cascade:

```css
/* Your existing styles work as normal */
.card { padding: 20px; border: 1px solid #ccc; }
.featured { border-color: gold; }

/* Diff styles override conflicting properties */
.diff-modified { color: orange; }  /* This color wins */
.diff-added { color: green; }   /* This color wins */
.diff-removed { color: red; }     /* This color wins */
```

This ensures your app's layout and design remain intact while only the diff highlighting is added on top.
