# Character Escaping

## tc - escaped asterisks

\*This text is not in italics\*

## tc - escaped bold markers

\*\*This text is not in bold\*\*

## tc - escaped link syntax

\[This is not a link]\(<https://example.com>)

## tc - escaped code backticks

\`This is not code\`

## tc - escaped list number

1\. This is not a list item

## tc - escaped list bullet

\- This is not a list item

## tc - escaped heading marker

\# This is not a heading

## tc - escaped blockquote marker

\> This is not a blockquote

## tc - escaped backslash - that doesnt need to be escaped

\ This shows a backslash

## tc - literal backslash

\This is a literal backslash at the start of text

## tc - html entities - get converted to special characters

HTML entities: & < > " '

## tc - literal special characters

Literal characters: & < > " '

## tc - literal markers in code

`*These are literal asterisks*`

## tc - literal link syntax in code

`[This is a literal bracket notation](not a link)`

## tc - literal html in code

`<html>This looks like HTML but inside code</html>`

## tc - escaped asterisk in italic

*Italic text with \* escaped asterisk*

## tc - escaped asterisks in bold

*Bold text with \* escaped asterisks*\*

## tc - escaped bracket in link

[Link with \[ escaped bracket](https://example.com)

## tc - escaped characters in code block

```
Code block with \* escaped asterisk
And a \`escaped backtick\`
```

## tc - escaped marker in blockquote should get removed if not needed

> Blockquote with > escaped angle bracket

## tc - multiple backslash escapes

\\\*This shows a backslash followed by an escaped asterisk\\\*

## tc - multiple backtick escapes

\\\`This shows a backslash followed by an escaped backtick\\\`

## tc - escaped url characters

[Link with escaped characters](https://example.com/\(parenthesis\))

## tc - encoded url characters

[Link with encoded characters](https://example.com/%28parenthesis%29)
