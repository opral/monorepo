# Limitations

## ⚠️ `data-diff-key` Required

Diff quality depends on stable `data-diff-key` attributes being present in the rendered HTML.

Without these attributes, the HTML differ cannot reliably match elements between the "before" and "after" versions, which may result in:

- Poor diff quality
- Elements being marked as completely removed/added instead of modified
- Inability to track changes within nested structures

## Best Practices

- Ensure `data-diff-key` attributes are stable across renders
- Use meaningful, unique identifiers for each element
- Include `data-diff-key` on all elements you want to track changes for
- Avoid dynamically generated IDs that change between renders
