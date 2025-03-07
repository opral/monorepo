# GitHub Flavored Markdown (GFM) Test Document

This document tests various features of GitHub Flavored Markdown (GFM).

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Paragraphs & Line Breaks

This is a paragraph with two sentences. Here is the second sentence.

This is another paragraph.

This is a line break.  
The next sentence should be on a new line.

## Emphasis

*Italic text* using asterisks.  
_Italic text_ using underscores.  
**Bold text** using double asterisks.  
__Bold text__ using double underscores.  
~~Strikethrough~~ using tildes.

## Lists

### Unordered List

- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
- Item 3

### Ordered List

1. First item
2. Second item
   1. Subitem 2.1
   2. Subitem 2.2
3. Third item

## Links

[GitHub](https://github.com) is a popular platform for hosting code.

## Images

![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="Github Logo"/>

## Blockquotes

> This is a blockquote. It can span multiple lines.
>
> - It supports lists.
> - And other formatting.

## Code Blocks

### Inline Code

Use `console.log("Hello, world!")` to print to the console.

### Fenced Code Blocks

no language

```
function greet() {
    console.log("Hello, world!");
}
```

```javascript
const message = "Hello, world!";
console.log(message);
```

no line:
```javascript
```

```javascript
const message = "one line"
```

```javascript
const message = "Hello, world!";
console.log(message);```

masked chars
```

inline with multiple(3) backticks

```javascript this.fn()```

inline with multiple(2) backticks

``javascript this.fn()``


inline with multiple(2) backticks

`javascript this.fn()`

test

## Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Data A   |
| Row 2    | Data 2   | Data B   |
| Row 3    | Data 3   | Data C   |

## Task Lists

- [x] Task 1
- [ ] Task 2
- [ ] Task 3

## Automatic URL Linking

http://example.com should automatically turn into a clickable link.

## Horizontal Rule

---

## Emojis

:smile: :rocket: :tada:

## Mentions & References

@octocat is a GitHub user.

Closes #1234

## Footnotes

This is a sentence with a footnote.[^1]

[^1]: This is the footnote content.

## HTML Support

<details>
  <summary>Click to expand</summary>
  Hidden content here.
</details>

