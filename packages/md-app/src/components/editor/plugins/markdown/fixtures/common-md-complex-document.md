# Comprehensive Markdown Test Document

## Introduction

This document demonstrates a wide variety of Markdown syntax elements and how they interact with each other. It's designed to test the roundtrip conversion capabilities of Markdown processors.

## Text Formatting

Plain text paragraphs are the most basic element. This paragraph demonstrates *italic text*, **bold text**, and ***bold italic text***.

You can also use _underscores_ for __emphasis__ and ___both___ if you prefer.

Other formatting options include ~~strikethrough~~ and `inline code`.

## Paragraphs and Line Breaks

Paragraphs are separated by blank lines.

This paragraph has a line break  
created with two trailing spaces.

This one has a line break\
created with a backslash.

## Headings
<!-- reason for differing expectation:
we currently expect a line break after each paragraph -->

# Level 1 Heading
## Level 2 Heading
### Level 3 Heading
#### Level 4 Heading
##### Level 5 Heading
###### Level 6 Heading

Alternative Level 1 Heading
===========================

Alternative Level 2 Heading
---------------------------

## Links

[Basic link](https://example.com)

[Link with title](https://example.com "Example Website")

<https://example.com> (Automatic link)

<email@example.com> (Email link)

[Reference link][ref]

[ref]: https://example.com "Reference Example"

## Images

![Image example](https://example.com/image.jpg "Sample Image")

![Reference image][img-ref]

[img-ref]: https://example.com/ref-image.jpg "Reference Image"

[![Image with link](https://example.com/image.jpg "Click me")](https://example.com)

## Lists
<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item
- Item 3

### Ordered Lists

1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item

### Mixed Lists

1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
     1. Ordered sub-sub-item
2. Second ordered item

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Blockquotes

> Simple blockquote

> Blockquote with **formatting** and a [link](https://example.com).
>
> Multiple paragraphs in a blockquote.
>
> > Nested blockquote.

## Code Blocks

Indented code block:

    function example() {
      return "Hello, world!";
    }

Fenced code block without language:

```
function example() {
  return "Hello, world!";
}
```

Fenced code block with language:

```javascript
function example() {
  return "Hello, world!";
}
```

## Tables

| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) | ![Image](https://example.com/image.jpg) | > Quote |

## Horizontal Rules

Above horizontal rule.

---

Between horizontal rules.

***

Between horizontal rules.

___

Below horizontal rule.

## HTML

<div style="color: blue;">
  Some HTML content 
  <span>with nested elements</span>
</div>

## Escaping Characters

\*This is not italic\*

\`This is not code\`

\# This is not a heading

## Combined Elements

> # Heading in a blockquote
>
> - List in a blockquote
>   1. Ordered in unordered
>   2. Another item
>
> ```javascript
> // Code in a blockquote
> console.log("Hello");
> ```

1. **Bold list item** with *italic text*
   - Nested list with `code` and [link](https://example.com)
     ```
     Code block in a list
     ```

## Special Characters

HTML entities: &amp; &lt; &gt; &quot; &apos;

Literal characters: & < > " '

## Footnotes

Text with a footnote.[^1]

Another paragraph with a different footnote.[^2]

[^1]: This is the first footnote.
[^2]: This is the second footnote with multiple lines.
    Indented to be part of the footnote.

## Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

## Line Breaks and Empty Paragraphs

This paragraph is followed by empty paragraphs.


This paragraph has multiple line breaks between it and the next paragraph.



This is the final paragraph.