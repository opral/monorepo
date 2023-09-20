# Table of Contents

inlang's website is using a custom structure for the table of contents. A real example of the structure can be found here: [tableOfContents.json](https://github.com/inlang/monorepo/blob/main/inlang/documentation/tableOfContents.json)

## Structure

### Variant 1

This variant can be used for a flat table of contents.

```json
[
	{
		"path": "path-to-file.md",
		"slug": "slug-of-url", // has to be unique
		"title": "Title of the page",
		"description": "Description of the page",
	}
]
```

### Variant 2

This variant can be used for a table of contents with categories.

```json
{
    "Category Name": [
        {
            "path": "path-to-file.md",
            "slug": "slug-of-url", // has to be unique
            "title": "Title of the page",
            "description": "Description of the page",
        }
    ]
}
```
