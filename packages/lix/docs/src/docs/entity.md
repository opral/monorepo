# What is an Entity?

In Lix, an **entity** is a meaningful, addressable unit of data within a file. Instead of treating a file as a single blob of text, Lix uses plugins to identify changes to these entities. The structure of each entity's data is described by a **[Lix Schema](./schema)**.

## Examples of Entities

The definition of an entity depends on the file type and the Lix plugin that handles it. Here are some common examples for both text-based and binary formats:

| File Type                          | Potential Entities                                                      |
| :--------------------------------- | :---------------------------------------------------------------------- |
| **JSON**                           | A specific key-value pair, an item in an array, or a nested object.     |
| **Spreadsheets (Excel, CSV, ...)** | A complete row, or an individual cell at a specific coordinate.         |
| **Documents (docx, md, ...)**      | A paragraph, a heading, a list item, or a code block.                   |
| **Design Files (Figma, Sketch)**   | A component, a frame, a layer, a text node, or a vector shape.          |
| **3D Models (glTF, FBX)**          | A mesh, a material, a bone in a skeleton, or a node in the scene graph. |
| **Image Files (PSD, Krita)**       | A layer, a labeled object or region, or a path.                         |

## Why Entities Matter

Traditional version control systems like Git track changes to files on a line-by-line basis. This works well for code but breaks down for complex binary formats like design files, PDFs, or Word documents. For example, imagine changing a single value in a JSON file:

```diff
- {"name":"John","age":30,"city":"New York"}
+ {"name":"John","age":31,"city":"New York"}
```

While this is hard for a human to read, the bigger problem for building applications is that this change is not _queryable_. An application cannot programmatically ask questions like, "What did the `age` property change from and to?" or "Show me the history of all changes to the `age` property." The diff shows _that_ a change happened, but the meaning of the change is lost and cannot be used by the software itself.

Lix's entity-based model solves this by unlocking several powerful capabilities:

- **Fine-Grained Diffs:** Instead of "line 5 changed," you get "the `age` property changed from 30 to 31." This is explained in more detail in the [Entity-Level Diffs](./diffs.mdx) documentation.
- **Precise Commenting:** You can attach a comment or discussion directly to a specific paragraph, a single cell in a table, or a particular function, rather than just to the file as a whole.
- **Smarter Merges:** Changes to different entities (like two separate properties in a JSON file) can be merged automatically without conflict, even if they are on the same line in the text file.
- **Granular Access Control:** You could implement a system where users have permission to edit specific entities (like certain fields in a configuration file) but not others.

## How Entities, Schemas, and Plugins Relate

The concepts of Entities, Schemas, and Plugins work together:

- A **[Lix Schema](./schema)** defines the _structure_ of an entity's data.
- A **Lix Plugin** understands a file format (like JSON) and is responsible for detecting changes to entities within that file.
- When a plugin detects a change, it reports it to Lix using the structure defined by the corresponding schema.

This separation of concerns makes the system highly extensible. You can teach Lix to understand any file format simply by creating a plugin that reports changes according to a defined schema.

## A Concrete Example: JSON Entities

Let's make this more concrete by looking at how the official Lix JSON plugin works.

When the JSON plugin processes a file like this:

```json
{
  "user": {
    "name": "John Doe"
  },
  "theme": "dark"
}
```

It "flattens" the object, treating each property path as a unique entity. For the example above, the plugin would identify two distinct entities:

1.  An entity with the ID `user.name`.
2.  An entity with the ID `theme`.

If a user changed the theme to "light", the plugin would detect this and report a change to the `theme` entity. The data for that change would conform to the plugin's `JSONPropertySchema`. You can read more about the anatomy of this schema in the **[Lix Schema](./schema)** documentation.

### Limitations

It's important to note that plugins define their own rules. The current JSON plugin, for example, treats entire arrays as a single value and does not track changes to individual items within an array. This is a design choice in the plugin to keep things simple, but a different, more complex JSON plugin could theoretically handle arrays differently.
