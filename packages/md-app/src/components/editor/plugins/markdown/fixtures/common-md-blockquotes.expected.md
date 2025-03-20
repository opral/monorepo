# Blockquotes
<!--
TEST REASONING:
The serialized blockquotes show significant restructuring:
1. Continuation markers (> at beginning of each line) are removed in multi-line blockquotes
2. Nested blockquotes are flattened with their content combined
3. Multiple paragraphs within blockquotes are similarly flattened
4. Complex content like headings and lists are preserved but without internal formatting

While these transformations alter the visual structure, the content remains
in blockquotes, preserving the essential semantic meaning. This is a compromise
between perfect fidelity and practical serialization.
-->


> This is a simple blockquote.

> This blockquote
spans multiple lines
in the source Markdown.

> This blockquote contains **formatted** text with _emphasis_ and `code`.

> This blockquote contains a [link](https://example.com).

> Nested blockquotes:
> > This is a nested blockquote.
> > > This is a deeply nested blockquote.

> Blockquote with multiple paragraphs:
>
> This is the second paragraph in the blockquote.
>
> This is the third paragraph in the blockquote.

> Blockquote with other elements:
>
> ### Heading in a blockquote
>
> - List item in blockquote
> - Another list item
>
> ```
> Code block in blockquote
> ```

> Blockquote followed by text.

Regular paragraph after a blockquote.

Text with > character that is not a blockquote.

Paragraph with a line break and then a blockquote:
> This blockquote comes after a line break in a paragraph.