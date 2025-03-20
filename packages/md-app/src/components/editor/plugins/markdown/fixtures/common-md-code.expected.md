# Code Elements
<!-- 
TEST REASONING:
Code formatting needs special attention because it affects functionality.
In this test, note that indented code blocks are converted to 
fenced code blocks (```). This is an acceptable transformation that maintains
or enhances functionality while preserving the content and meaning.
-->


## Inline Code

This is a paragraph with `inline code` inside.

Here's some more `inline code with **formatting**` which should be preserved literally.

## Code Blocks with Backticks

```
This is a simple code block
without language specification
function test() {
  return true;
}
```

## Code Blocks with Language Syntax Highlighting

```javascript
// JavaScript code
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

```python
# Python code
def greet(name):
    print(f"Hello, {name}!")
    return True
```

```css
/* CSS code */
.container {
  display: flex;
  flex-direction: column;
}
```

## Empty Code Blocks

```
```

```javascript
```

## Indented Code Blocks

```
This is an indented code block
It uses 4 spaces for indentation
function test() {
  return true;
}
```

## Code Blocks with Nested Backticks

````
This code block contains triple backticks
```
nested code
```
````

## Code Blocks with Special Characters

```
Special characters: & < > " '
HTML entities: &amp; &lt; &gt; &quot; &apos;
```

## Code Blocks with Multiple Lines

```
Line 1
Line 2
Line 3

Line 5 (after empty line)
```

## Code Blocks with Multiple Lines

```
Line 1
Line 2


Line 5 (after two empty lines)

Line 7 (after one empty lines)
```