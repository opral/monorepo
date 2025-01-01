---
imports:
  - "../dist/doc-hero.js"
---

### doc-hero

The `<doc-hero>` element is used to display a hero section.

#### Attributes

- `title`: The title of the hero section.
- `description`: The description of the hero section.
- `primary-text`: The text for the primary button.
- `primary-link`: The link for the primary button.
- `secondary-text`: The text for the secondary button.
- `secondary-link`: The link for the secondary button.
- `tag`: The tag text.
- `companies`: A JSON string of company logos.

#### Example

```html
<doc-hero 
  title="Hero Title" 
  description="Hero Description" 
  primary-text="Primary Button" 
  primary-link="https://example.com" 
  secondary-text="Secondary Button" 
  secondary-link="https://example.com" 
  tag="Tag Text" 
  companies='["company1.png", "company2.png"]'>
</doc-hero>
```

<doc-hero 
  title="Hero Title" 
  description="Hero Description" 
  primary-text="Primary Button" 
  primary-link="https://example.com" 
  secondary-text="Secondary Button" 
  secondary-link="https://example.com" 
  tag="Tag Text" 
  companies='["company1.png", "company2.png"]'>
</doc-hero>
