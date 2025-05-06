# Code Elements

<!-- 
TEST REASONING:
Code formatting needs special attention because it affects functionality.
In this test, note that indented code blocks are converted to 
fenced code blocks (```). This is an acceptable transformation that maintains
or enhances functionality while preserving the content and meaning.
-->

## tc - inline code

This is a paragraph with `inline code` inside.

## tc - inline code with formatting characters

Here's some more `inline code with **formatting**` which should be preserved literally.

## tc - simple code block

```
This is a simple code block
without language specification
function test() {
  return true;
}
```

## tc - javascript code block

```javascript
// JavaScript code
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

## tc - python code block

```python
# Python code
def greet(name):
    print(f"Hello, {name}!")
    return True
```

## tc - css code block

```css
/* CSS code */
.container {
  display: flex;
  flex-direction: column;
}
```

## tc - empty code block

```
```

## tc - empty code block with language

```javascript
```

## tc - indented code block

```
This is an indented code block
It uses 4 spaces for indentation
function test() {
  return true;
}
```

## tc - code block with nested backticks

this codeblock contains another

````
This code block contains triple backticks
```
nested code
```
````

## tc - code block with special characters

```
Special characters: & < > " '
HTML entities: &amp; &lt; &gt; &quot; &apos;
```

## tc - code block with line break

```
Line 1
Line 2
Line 3

Line 5 (after empty line)
```

## tc - code block with multiple empty lines

```
Line 1
Line 2


Line 5 (after two empty lines)

Line 7 (after one empty lines)
```
