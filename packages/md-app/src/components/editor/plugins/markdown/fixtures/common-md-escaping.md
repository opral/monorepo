# Character Escaping

## Escaping Markdown Syntax Characters

\*This text is not in italics\*

\**This text is not in bold**

\[This is not a link](https://example.com)

\`This is not code\`

1\. This is not a list item

\- This is not a list item

\# This is not a heading

\> This is not a blockquote

\\ This shows a backslash

\This is a literal backslash at the start of text

## Special Characters

HTML entities: &amp; &lt; &gt; &quot; &apos;

Literal characters: & < > " '

## Code with Special Characters

`*These are literal asterisks*`

`[This is a literal bracket notation](not a link)`

`<html>This looks like HTML but inside code</html>`

## Backslash Escapes in Different Contexts

*Italic text with \* escaped asterisk*

**Bold text with \** escaped asterisks**

[Link with \[ escaped bracket](https://example.com)

```
Code block with \* escaped asterisk
And a \`escaped backtick\`
```

> Blockquote with \> escaped angle bracket

## Multiple Escapes

\\\*This shows a backslash followed by an escaped asterisk\\\*

\\\`This shows a backslash followed by an escaped backtick\\\`

## Escapes in URLs

[Link with escaped characters](https://example.com/\(parenthesis\))

[Link with encoded characters](https://example.com/%28parenthesis%29)