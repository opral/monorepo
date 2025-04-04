# Markdown Roundtrip Test Results

## Summary

- Total test files: 17
- Total test cases: 130
- Generated on: 2025-04-04T10:51:56.002Z

### Overall Status: ❌ 55 Failing Tests

### Test Results Breakdown

- 🟢 Perfect roundtrip: 64/130 (49%)
- 🟡 Acceptable transformation: 11/130 (8%)
- 🔴 Failing tests: 55/130 (42%)

### Known Issues in the Markdown Parser

1. Line breaks in code blocks are not preserved
2. Nested backticks in code blocks (like ``` inside ````) are not properly handled
3. Line breaks in paragraphs (trailing spaces or backslash) are not preserved
4. Some link formats are modified (e.g., automatic links)
5. Indentation in lists may change
6. Empty lines between list items are removed

---

# Test File: common-md-blockquotes

## Test Summary

- 🟢 Perfect roundtrip (input = output): 3/9 (33%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/9 (11%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 5/9 (56%)

**Overall Status**: ❌ 5 failing tests

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - simple blockquote.</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

> This is a simple blockquote.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; This is a simple blockquote.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - multi line blockquote.</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

> This blockquote
spans multiple lines
in the source Markdown.

</td>
<td>

> This blockquote
> spans multiple lines
> in the source Markdown.

</td>
<td>

> This blockquote
> spans multiple lines
> in the source Markdown.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; This blockquote
spans multiple lines
in the source Markdown.</code></pre>

</td>
<td>

<pre><code>&gt; This blockquote
&gt; spans multiple lines
&gt; in the source Markdown.</code></pre>

</td>
<td>

<pre><code>&gt; This blockquote
&gt; spans multiple lines
&gt; in the source Markdown.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquote - inline formatting</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> This blockquote contains **formatted** text with _emphasis_ and `code`.

</td>
<td>

> This blockquote contains 
>
> **formatted**
>
>  text with 
>
> *emphasis*
>
>  and 
>
> `code`
>
> .

</td>
</tr>
<tr>
<td>

<pre><code>&gt; This blockquote contains **formatted** text with _emphasis_ and `code`.</code></pre>

</td>
<td>

<pre><code>&gt; This blockquote contains 
&gt;
&gt; **formatted**
&gt;
&gt;  text with 
&gt;
&gt; *emphasis*
&gt;
&gt;  and 
&gt;
&gt; `code`
&gt;
&gt; .</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquote - with link</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> This blockquote contains a [link](https://example.com).

</td>
<td>

> This blockquote contains a 
>
> [link](https://example.com)
>
> .

</td>
</tr>
<tr>
<td>

<pre><code>&gt; This blockquote contains a [link](https://example.com).</code></pre>

</td>
<td>

<pre><code>&gt; This blockquote contains a 
&gt;
&gt; [link](https://example.com)
&gt;
&gt; .</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquote - nested</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> Nested blockquotes:
> > This is a nested blockquote.
> > > This is a deeply nested blockquote.

</td>
<td>

> Nested blockquotes:
>
> This is a nested blockquote.
>
> This is a deeply nested blockquote.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Nested blockquotes:
&gt; &gt; This is a nested blockquote.
&gt; &gt; &gt; This is a deeply nested blockquote.</code></pre>

</td>
<td>

<pre><code>&gt; Nested blockquotes:
&gt;
&gt; This is a nested blockquote.
&gt;
&gt; This is a deeply nested blockquote.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquote - multiple paragraphs</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

> Blockquote with multiple paragraphs:  
> This is the second paragraph in the blockquote.  
> This is the third paragraph in **the** blockquote.  
> This is the fourth paragraph in the blockquote.

</td>
<td>

> Blockquote with multiple paragraphs:
>
> This is the second paragraph in the blockquote.
>
> This is the third paragraph in **the** blockquote. 
> 
> This is the fourth paragraph in the blockquote.

</td>
<td>

> Blockquote with multiple paragraphs:This is the second paragraph in the blockquote.This is the third paragraph in 
>
> **the**
>
>  blockquote.This is the fourth paragraph in the blockquote.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Blockquote with multiple paragraphs:  
&gt; This is the second paragraph in the blockquote.  
&gt; This is the third paragraph in **the** blockquote.  
&gt; This is the fourth paragraph in the blockquote.</code></pre>

</td>
<td>

<pre><code>&gt; Blockquote with multiple paragraphs:
&gt;
&gt; This is the second paragraph in the blockquote.
&gt;
&gt; This is the third paragraph in **the** blockquote. 
&gt; 
&gt; This is the fourth paragraph in the blockquote.</code></pre>

</td>
<td>

<pre><code>&gt; Blockquote with multiple paragraphs:This is the second paragraph in the blockquote.This is the third paragraph in 
&gt;
&gt; **the**
&gt;
&gt;  blockquote.This is the fourth paragraph in the blockquote.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquote - containing markdown</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> Blockquote with other elements:
>
> ## tc - Heading in a blockquote
>
> - List item in blockquote
> - Another list item
>
> ```
> Code block in blockquote
> ```

</td>
<td>

> Blockquote with other elements:tc - Heading in a blockquote

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Blockquote with other elements:
&gt;
&gt; ## tc - Heading in a blockquote
&gt;
&gt; - List item in blockquote
&gt; - Another list item
&gt;
&gt; ```
&gt; Code block in blockquote
&gt; ```</code></pre>

</td>
<td>

<pre><code>&gt; Blockquote with other elements:tc - Heading in a blockquote</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - blockquote - followed by text</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

> Blockquote followed by text.

Regular paragraph after a blockquote.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Blockquote followed by text.

Regular paragraph after a blockquote.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - blockquote - character inline - not detef</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Text with > character that is not a blockquote.

Paragraph with a line break and then a blockquote:

> This blockquote comes after a line break in a paragraph.

</td>
</tr>
<tr>
<td>

<pre><code>Text with &gt; character that is not a blockquote.

Paragraph with a line break and then a blockquote:

&gt; This blockquote comes after a line break in a paragraph.</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-code

## Test Summary

- 🟢 Perfect roundtrip (input = output): 12/13 (92%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/13 (8%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 0/13 (0%)

**Overall Status**: ✅ All tests passing (12 perfect, 1 acceptable)

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - inline code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This is a paragraph with `inline code` inside.

</td>
</tr>
<tr>
<td>

<pre><code>This is a paragraph with `inline code` inside.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - inline code with formatting characters</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Here's some more `inline code with **formatting**` which should be preserved literally.

</td>
</tr>
<tr>
<td>

<pre><code>Here&#039;s some more `inline code with **formatting**` which should be preserved literally.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - simple code block</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```
This is a simple code block
without language specification
function test() {
  return true;
}
```

</td>
</tr>
<tr>
<td>

<pre><code>```
This is a simple code block
without language specification
function test() {
  return true;
}
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - javascript code block</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```javascript
// JavaScript code
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

</td>
</tr>
<tr>
<td>

<pre><code>```javascript
// JavaScript code
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - python code block</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```python
# Python code
def greet(name):
    print(f"Hello, {name}!")
    return True
```

</td>
</tr>
<tr>
<td>

<pre><code>```python
# Python code
def greet(name):
    print(f&quot;Hello, {name}!&quot;)
    return True
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - css code block</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```css
/* CSS code */
.container {
  display: flex;
  flex-direction: column;
}
```

</td>
</tr>
<tr>
<td>

<pre><code>```css
/* CSS code */
.container {
  display: flex;
  flex-direction: column;
}
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - empty code block</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```
```

</td>
</tr>
<tr>
<td>

<pre><code>```
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - empty code block with language</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```javascript
```

</td>
</tr>
<tr>
<td>

<pre><code>```javascript
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - indented code block</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This is an indented code block
    It uses 4 spaces for indentation
    function test() {
      return true;
    }

</td>
<td>

```
This is an indented code block
It uses 4 spaces for indentation
function test() {
  return true;
}
```

</td>
<td>

```
This is an indented code block
It uses 4 spaces for indentation
function test() {
  return true;
}
```

</td>
</tr>
<tr>
<td>

<pre><code>This is an indented code block
    It uses 4 spaces for indentation
    function test() {
      return true;
    }</code></pre>

</td>
<td>

<pre><code>```
This is an indented code block
It uses 4 spaces for indentation
function test() {
  return true;
}
```</code></pre>

</td>
<td>

<pre><code>```
This is an indented code block
It uses 4 spaces for indentation
function test() {
  return true;
}
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - code block with nested backticks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

this codeblock contains another

````
This code block contains triple backticks
```
nested code
```
````

</td>
</tr>
<tr>
<td>

<pre><code>this codeblock contains another

````
This code block contains triple backticks
```
nested code
```
````</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - code block with special characters</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```
Special characters: & < > " '
HTML entities: &amp; &lt; &gt; &quot; &apos;
```

</td>
</tr>
<tr>
<td>

<pre><code>```
Special characters: &amp; &lt; &gt; &quot; &#039;
HTML entities: &amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;apos;
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - code block with line break</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```
Line 1
Line 2
Line 3

Line 5 (after empty line)
```

</td>
</tr>
<tr>
<td>

<pre><code>```
Line 1
Line 2
Line 3

Line 5 (after empty line)
```</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - code block with multiple empty lines</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```
Line 1
Line 2


Line 5 (after two empty lines)

Line 7 (after one empty lines)
```

</td>
</tr>
<tr>
<td>

<pre><code>```
Line 1
Line 2


Line 5 (after two empty lines)

Line 7 (after one empty lines)
```</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-complex-document

## Test Summary

- 🟢 Perfect roundtrip (input = output): 5/25 (20%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/25 (4%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 19/25 (76%)

**Overall Status**: ❌ 19 failing tests

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - introduction</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This document demonstrates a wide variety of Markdown syntax elements and how they interact with each other. It's designed to test the roundtrip conversion capabilities of Markdown processors.

</td>
</tr>
<tr>
<td>

<pre><code>This document demonstrates a wide variety of Markdown syntax elements and how they interact with each other. It&#039;s designed to test the roundtrip conversion capabilities of Markdown processors.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - text formatting - italic</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates *italic text* inline also wiht _underscore_

</td>
<td>

This paragraph demonstrates _italic text_ inline also wiht _underscore_

</td>
<td>

This paragraph demonstrates *italic text* inline also wiht *underscore*

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates *italic text* inline also wiht _underscore_</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates _italic text_ inline also wiht _underscore_</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates *italic text* inline also wiht *underscore*</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - text formatting - bold/emphasis</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates __bold/emphasis text__ inline

</td>
<td>

This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline

</td>
<td>

This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates __bold/emphasis text__ inline</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - text formatting - bold AND italic with asterix *</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates ***italic AND bold text*** inline

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates ***italic AND bold text*** inline</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - text formatting - bold AND italic with underscore _</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates ___italic AND bold text___ inline

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates ___italic AND bold text___ inline</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - text formatting - strikethrough and inline code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Other formatting options include ~~strikethrough~~ and `inline code`.

</td>
</tr>
<tr>
<td>

<pre><code>Other formatting options include ~~strikethrough~~ and `inline code`.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - paragraphs and line breaks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Paragraphs are separated by blank lines.

This paragraph has a line break  
created with two trailing spaces.

This one has a line break\
created with a backslash.

This one has a line break<br>created with a break tag.

This one has a line break<br>
created with a break tag.

And another one to check if it worked

</td>
<td>

Paragraphs are separated by blank lines.

This paragraph has a line break<br>created with two trailing spaces.

This one has a line break<br>created with a backslash.

This one has a line break<br>created with a break tag.

And another one to check if it worked

</td>
<td>

Paragraphs are separated by blank lines.

This paragraph has a line breakcreated with two trailing spaces.

This one has a line breakcreated with a backslash.

This one has a line break<br />created with a break tag.

This one has a line break<br />
created with a break tag.

And another one to check if it worked

</td>
</tr>
<tr>
<td>

<pre><code>Paragraphs are separated by blank lines.

This paragraph has a line break  
created with two trailing spaces.

This one has a line break\
created with a backslash.

This one has a line break&lt;br&gt;created with a break tag.

This one has a line break&lt;br&gt;
created with a break tag.

And another one to check if it worked</code></pre>

</td>
<td>

<pre><code>Paragraphs are separated by blank lines.

This paragraph has a line break&lt;br&gt;created with two trailing spaces.

This one has a line break&lt;br&gt;created with a backslash.

This one has a line break&lt;br&gt;created with a break tag.

And another one to check if it worked</code></pre>

</td>
<td>

<pre><code>Paragraphs are separated by blank lines.

This paragraph has a line breakcreated with two trailing spaces.

This one has a line breakcreated with a backslash.

This one has a line break&lt;br /&gt;created with a break tag.

This one has a line break&lt;br /&gt;
created with a break tag.

And another one to check if it worked</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - headings</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

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

</td>
<td>

<!-- reason for differing expectation:
we currently expect a line break after each paragraph -->


# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading

</td>
<td>

<!-- reason for differing expectation:
we currently expect a line break after each paragraph -->

# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading

</td>
</tr>
<tr>
<td>

<pre><code>&lt;!-- reason for differing expectation:
we currently expect a line break after each paragraph --&gt;

# Level 1 Heading
## Level 2 Heading
### Level 3 Heading
#### Level 4 Heading
##### Level 5 Heading
###### Level 6 Heading

Alternative Level 1 Heading
===========================

Alternative Level 2 Heading
---------------------------</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
we currently expect a line break after each paragraph --&gt;


# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
we currently expect a line break after each paragraph --&gt;

# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - links</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

[Basic link](https://example.com)

[Link with title](https://example.com "Example Website")

<https://example.com> (Automatic link)

<email@example.com> (Email link)

[Reference link][ref]

[ref]: https://example.com "Reference Example"

</td>
<td>

[Basic link](https://example.com)

[Link with title](https://example.com)

<https://example.com> (Automatic link)

<email@example.com> (Email link)

</td>
</tr>
<tr>
<td>

<pre><code>[Basic link](https://example.com)

[Link with title](https://example.com &quot;Example Website&quot;)

&lt;https://example.com&gt; (Automatic link)

&lt;email@example.com&gt; (Email link)

[Reference link][ref]

[ref]: https://example.com &quot;Reference Example&quot;</code></pre>

</td>
<td>

<pre><code>[Basic link](https://example.com)

[Link with title](https://example.com)

&lt;https://example.com&gt; (Automatic link)

&lt;email@example.com&gt; (Email link)</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - images</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

![Image example](https://example.com/image.jpg "Sample Image")

![Reference image][img-ref]

[img-ref]: https://example.com/ref-image.jpg "Reference Image"

[![Image with link](https://example.com/image.jpg "Click me")](https://example.com)

</td>
<td>

![Image example](https://example.com/image.jpg "Image example")

[![Image with link](https://example.com/image.jpg "Image with link")](https://example.com)

</td>
</tr>
<tr>
<td>

<pre><code>![Image example](https://example.com/image.jpg &quot;Sample Image&quot;)

![Reference image][img-ref]

[img-ref]: https://example.com/ref-image.jpg &quot;Reference Image&quot;

[![Image with link](https://example.com/image.jpg &quot;Click me&quot;)](https://example.com)</code></pre>

</td>
<td>

<pre><code>![Image example](https://example.com/image.jpg &quot;Image example&quot;)

[![Image with link](https://example.com/image.jpg &quot;Image with link&quot;)](https://example.com)</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - unordered lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item
- Item 3

</td>
<td>

<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->

### Unordered Lists
- Item 1
- Item 2
   - Nested item 2.1
   - Nested item 2.2
      - Deeply nested item
- Item 3

</td>
<td>

<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->

### Unordered Lists

* Item 1

* Item 2

  * Nested item 2.1

  * Nested item 2.2

    * Deeply nested item

* Item 3

</td>
</tr>
<tr>
<td>

<pre><code>&lt;!-- reason for differing expectation:
the identation may differ 1 meaning is the same --&gt;

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item
- Item 3</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
the identation may differ 1 meaning is the same --&gt;

### Unordered Lists
- Item 1
- Item 2
   - Nested item 2.1
   - Nested item 2.2
      - Deeply nested item
- Item 3</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
the identation may differ 1 meaning is the same --&gt;

### Unordered Lists

* Item 1

* Item 2

  * Nested item 2.1

  * Nested item 2.2

    * Deeply nested item

* Item 3</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - ordered lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

### Ordered Lists

1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item

</td>
<td>

### Ordered Lists
1. First item
2. Second item
    1. Nested first
    2. Nested second
3. Third item

</td>
<td>

### Ordered Lists

1. First item

2. Second item

   1. Nested first

   2. Nested second

3. Third item

</td>
</tr>
<tr>
<td>

<pre><code>### Ordered Lists

1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item</code></pre>

</td>
<td>

<pre><code>### Ordered Lists
1. First item
2. Second item
    1. Nested first
    2. Nested second
3. Third item</code></pre>

</td>
<td>

<pre><code>### Ordered Lists

1. First item

2. Second item

   1. Nested first

   2. Nested second

3. Third item</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - mixed lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

### Mixed Lists

1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
     1. Ordered sub-sub-item
2. Second ordered item

</td>
<td>

### Mixed Lists
1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
       1. Ordered sub-sub-item
2. Second ordered item

</td>
<td>

### Mixed Lists

1. First ordered item

   * Unordered sub-item

   * Another unordered sub-item

     1. Ordered sub-sub-item

2. Second ordered item

</td>
</tr>
<tr>
<td>

<pre><code>### Mixed Lists

1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
     1. Ordered sub-sub-item
2. Second ordered item</code></pre>

</td>
<td>

<pre><code>### Mixed Lists
1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
       1. Ordered sub-sub-item
2. Second ordered item</code></pre>

</td>
<td>

<pre><code>### Mixed Lists

1. First ordered item

   * Unordered sub-item

   * Another unordered sub-item

     1. Ordered sub-sub-item

2. Second ordered item</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - task lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

</td>
<td>

### Task Lists

* \[x] Completed task

* \[ ] Incomplete task

* \[x] Another completed task

</td>
</tr>
<tr>
<td>

<pre><code>### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task</code></pre>

</td>
<td>

<pre><code>### Task Lists

* \[x] Completed task

* \[ ] Incomplete task

* \[x] Another completed task</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquotes</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> Simple blockquote

> Blockquote with **formatting** and a [link](https://example.com).
>
> Multiple paragraphs in a blockquote.
>
> > Nested blockquote.

</td>
<td>

> Simple blockquote

> Blockquote with 
>
> **formatting**
>
>  and a 
>
> [link](https://example.com)
>
> .Multiple paragraphs in a blockquote.
>
> Nested blockquote.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Simple blockquote

&gt; Blockquote with **formatting** and a [link](https://example.com).
&gt;
&gt; Multiple paragraphs in a blockquote.
&gt;
&gt; &gt; Nested blockquote.</code></pre>

</td>
<td>

<pre><code>&gt; Simple blockquote

&gt; Blockquote with 
&gt;
&gt; **formatting**
&gt;
&gt;  and a 
&gt;
&gt; [link](https://example.com)
&gt;
&gt; .Multiple paragraphs in a blockquote.
&gt;
&gt; Nested blockquote.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - code blocks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

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

</td>
<td>

Indented code block:

```
function example() {
  return "Hello, world!";
}
```

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

</td>
</tr>
<tr>
<td>

<pre><code>Indented code block:

    function example() {
      return &quot;Hello, world!&quot;;
    }

Fenced code block without language:

```
function example() {
  return &quot;Hello, world!&quot;;
}
```

Fenced code block with language:

```javascript
function example() {
  return &quot;Hello, world!&quot;;
}
```</code></pre>

</td>
<td>

<pre><code>Indented code block:

```
function example() {
  return &quot;Hello, world!&quot;;
}
```

Fenced code block without language:

```
function example() {
  return &quot;Hello, world!&quot;;
}
```

Fenced code block with language:

```javascript
function example() {
  return &quot;Hello, world!&quot;;
}
```</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - tables</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) | ![Image](https://example.com/image.jpg) | > Quote |

</td>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) |&#x20;

![Image](https://example.com/image.jpg "Image")

&#x20;| > Quote |

</td>
</tr>
<tr>
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) | ![Image](https://example.com/image.jpg) | &gt; Quote |</code></pre>

</td>
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) |&amp;#x20;

![Image](https://example.com/image.jpg &quot;Image&quot;)

&amp;#x20;| &gt; Quote |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - horizontal rules</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Above horizontal rule.

---

Between horizontal rules.

***

Between horizontal rules.

___

Below horizontal rule.

</td>
<td>

Above horizontal rule.

---

Between horizontal rules.

---

Between horizontal rules.

---

Below horizontal rule.

</td>
<td>

Above horizontal rule.

***

Between horizontal rules.

***

Between horizontal rules.

***

Below horizontal rule.

</td>
</tr>
<tr>
<td>

<pre><code>Above horizontal rule.

---

Between horizontal rules.

***

Between horizontal rules.

___

Below horizontal rule.</code></pre>

</td>
<td>

<pre><code>Above horizontal rule.

---

Between horizontal rules.

---

Between horizontal rules.

---

Below horizontal rule.</code></pre>

</td>
<td>

<pre><code>Above horizontal rule.

***

Between horizontal rules.

***

Between horizontal rules.

***

Below horizontal rule.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - html</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

<div style="color: blue;">
  Some HTML content 
  <span>with nested elements</span>
</div>

</td>
</tr>
<tr>
<td>

<pre><code>&lt;div style=&quot;color: blue;&quot;&gt;
  Some HTML content 
  &lt;span&gt;with nested elements&lt;/span&gt;
&lt;/div&gt;</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaping characters</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\*This is not italic\*

\`This is not code\`

\# This is not a heading

</td>
</tr>
<tr>
<td>

<pre><code>\*This is not italic\*

\`This is not code\`

\# This is not a heading</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - combined elements</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

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

</td>
<td>

> Heading in a blockquote

1. **Bold list item** with *italic text*

   * Nested list with `code` and [link](https://example.com)

</td>
</tr>
<tr>
<td>

<pre><code>&gt; # Heading in a blockquote
&gt;
&gt; - List in a blockquote
&gt;   1. Ordered in unordered
&gt;   2. Another item
&gt;
&gt; ```javascript
&gt; // Code in a blockquote
&gt; console.log(&quot;Hello&quot;);
&gt; ```

1. **Bold list item** with *italic text*
   - Nested list with `code` and [link](https://example.com)
     ```
     Code block in a list
     ```</code></pre>

</td>
<td>

<pre><code>&gt; Heading in a blockquote

1. **Bold list item** with *italic text*

   * Nested list with `code` and [link](https://example.com)</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - special characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

HTML entities: &amp; &lt; &gt; &quot; &apos;

Literal characters: & < > " '

</td>
<td>

HTML entities: & < > " '

Literal characters: & < > " '

</td>
</tr>
<tr>
<td>

<pre><code>HTML entities: &amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;apos;

Literal characters: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
<td>

<pre><code>HTML entities: &amp; &lt; &gt; &quot; &#039;

Literal characters: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - footnotes</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

Text with a footnote.[^1]

Another paragraph with a different footnote.[^2]

[^1]: This is the first footnote.
[^2]: This is the second footnote with multiple lines.
    Indented to be part of the footnote.

</td>
<td>

Text with a footnote.\[^1]

Another paragraph with a different footnote.\[^2]

\[^1]: This is the first footnote.
\[^2]: This is the second footnote with multiple lines.
Indented to be part of the footnote.

</td>
</tr>
<tr>
<td>

<pre><code>Text with a footnote.[^1]

Another paragraph with a different footnote.[^2]

[^1]: This is the first footnote.
[^2]: This is the second footnote with multiple lines.
    Indented to be part of the footnote.</code></pre>

</td>
<td>

<pre><code>Text with a footnote.\[^1]

Another paragraph with a different footnote.\[^2]

\[^1]: This is the first footnote.
\[^2]: This is the second footnote with multiple lines.
Indented to be part of the footnote.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - definition lists</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

</td>
</tr>
<tr>
<td>

<pre><code>Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - line breaks and empty paragraphs</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph is followed by empty paragraphs.


This paragraph has multiple line breaks between it and the next paragraph.



This is the final paragraph.

</td>
<td>

This paragraph is followed by empty paragraphs.

This paragraph has multiple line breaks between it and the next paragraph.

This is the final paragraph.

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph is followed by empty paragraphs.


This paragraph has multiple line breaks between it and the next paragraph.



This is the final paragraph.</code></pre>

</td>
<td>

<pre><code>This paragraph is followed by empty paragraphs.

This paragraph has multiple line breaks between it and the next paragraph.

This is the final paragraph.</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-emphasis

## Test Summary

- 🟢 Perfect roundtrip (input = output): 5/11 (45%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 2/11 (18%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 4/11 (36%)

**Overall Status**: ❌ 4 failing tests

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - italic with asterisks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

*Italic text* using single asterisks.

</td>
</tr>
<tr>
<td>

<pre><code>*Italic text* using single asterisks.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - italic with underscores</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

_Italic text_ using single underscores.

</td>
<td>

*Italic text* using single underscores.

</td>
</tr>
<tr>
<td>

<pre><code>_Italic text_ using single underscores.</code></pre>

</td>
<td>

<pre><code>*Italic text* using single underscores.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - bold with asterisks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

**Bold text** using double asterisks.

</td>
</tr>
<tr>
<td>

<pre><code>**Bold text** using double asterisks.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - bold with underscores</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

__Bold text__ using double underscores.

</td>
<td>

**Bold text** using double underscores.

</td>
<td>

**Bold text** using double underscores.

</td>
</tr>
<tr>
<td>

<pre><code>__Bold text__ using double underscores.</code></pre>

</td>
<td>

<pre><code>**Bold text** using double underscores.</code></pre>

</td>
<td>

<pre><code>**Bold text** using double underscores.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - bold-italic with asterisks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

***Bold and italic*** using triple asterisks.

</td>
</tr>
<tr>
<td>

<pre><code>***Bold and italic*** using triple asterisks.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - bold-italic with underscores</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

___Bold and italic___ using triple underscores.

</td>
<td>

***Bold and italic*** using triple underscores.

</td>
<td>

***Bold and italic*** using triple underscores.

</td>
</tr>
<tr>
<td>

<pre><code>___Bold and italic___ using triple underscores.</code></pre>

</td>
<td>

<pre><code>***Bold and italic*** using triple underscores.</code></pre>

</td>
<td>

<pre><code>***Bold and italic*** using triple underscores.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - mixed formatting inline</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

**Bold text with** ***italic*** **inside**.
**Bold text with *italic* inside**.

</td>
<td>

**Bold text with _italic_ inside**.

</td>
<td>

**Bold text with** ***italic*** **inside**.
**Bold text with *italic*** **inside**.

</td>
</tr>
<tr>
<td>

<pre><code>**Bold text with** ***italic*** **inside**.
**Bold text with *italic* inside**.</code></pre>

</td>
<td>

<pre><code>**Bold text with _italic_ inside**.</code></pre>

</td>
<td>

<pre><code>**Bold text with** ***italic*** **inside**.
**Bold text with *italic*** **inside**.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - italic with bold inside</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

*Italic text with **bold** inside*.

</td>
</tr>
<tr>
<td>

<pre><code>*Italic text with **bold** inside*.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - strikethrough</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

~~Strikethrough text~~ using double tildes.

</td>
<td>

\~~Strikethrough text~~ using double tildes.

</td>
</tr>
<tr>
<td>

<pre><code>~~Strikethrough text~~ using double tildes.</code></pre>

</td>
<td>

<pre><code>\~~Strikethrough text~~ using double tildes.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - mixed styles in paragraph</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Mixed **bold** and *italic* and ~~strikethrough~~ in one paragraph.

</td>
</tr>
<tr>
<td>

<pre><code>Mixed **bold** and *italic* and ~~strikethrough~~ in one paragraph.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - nested styles</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Text with **multiple __styles__** applied.

</td>
<td>

Text with **multiple _styles_** applied.

</td>
<td>

Text with **multiple styles** applied.

</td>
</tr>
<tr>
<td>

<pre><code>Text with **multiple __styles__** applied.</code></pre>

</td>
<td>

<pre><code>Text with **multiple _styles_** applied.</code></pre>

</td>
<td>

<pre><code>Text with **multiple styles** applied.</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-empty-paragraphs

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/1 (100%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 0/1 (0%)

**Overall Status**: ✅ All tests passing (0 perfect, 1 acceptable)

---

<details >
<summary><span style="color:#cc7700; font-weight:bold;">Document</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

# Empty paragraphs test
<!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
-->

Line with content


Another line with content



Multiple empty lines between content


Last line

</td>
<td>

# Empty paragraphs test

<!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
-->

Line with content

Another line with content

Multiple empty lines between content

Last line

</td>
<td>

# Empty paragraphs test

<!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
-->

Line with content

Another line with content

Multiple empty lines between content

Last line


</td>
</tr>
<tr>
<td>

<pre><code># Empty paragraphs test
&lt;!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
--&gt;

Line with content


Another line with content



Multiple empty lines between content


Last line</code></pre>

</td>
<td>

<pre><code># Empty paragraphs test

&lt;!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
--&gt;

Line with content

Another line with content

Multiple empty lines between content

Last line</code></pre>

</td>
<td>

<pre><code># Empty paragraphs test

&lt;!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
--&gt;

Line with content

Another line with content

Multiple empty lines between content

Last line
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-escaping

## Test Summary

- 🟢 Perfect roundtrip (input = output): 18/24 (75%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/24 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 6/24 (25%)

**Overall Status**: ❌ 6 failing tests

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped asterisks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\*This text is not in italics\*

</td>
</tr>
<tr>
<td>

<pre><code>\*This text is not in italics\*</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped bold markers</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\**This text is not in bold**

</td>
<td>

\*\*This text is not in bold\*\*

</td>
</tr>
<tr>
<td>

<pre><code>\**This text is not in bold**</code></pre>

</td>
<td>

<pre><code>\*\*This text is not in bold\*\*</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped link syntax</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\[This is not a link](https://example.com)

</td>
<td>

\[This is not a link]\(https://example.com)

</td>
</tr>
<tr>
<td>

<pre><code>\[This is not a link](https://example.com)</code></pre>

</td>
<td>

<pre><code>\[This is not a link]\(https://example.com)</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped code backticks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\`This is not code\`

</td>
</tr>
<tr>
<td>

<pre><code>\`This is not code\`</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped list number</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

1\. This is not a list item

</td>
</tr>
<tr>
<td>

<pre><code>1\. This is not a list item</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped list bullet</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\- This is not a list item

</td>
</tr>
<tr>
<td>

<pre><code>\- This is not a list item</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped heading marker</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\# This is not a heading

</td>
</tr>
<tr>
<td>

<pre><code>\# This is not a heading</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped blockquote marker</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\> This is not a blockquote

</td>
</tr>
<tr>
<td>

<pre><code>\&gt; This is not a blockquote</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped backslash</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\\ This shows a backslash

</td>
<td>

\ This shows a backslash

</td>
</tr>
<tr>
<td>

<pre><code>\\ This shows a backslash</code></pre>

</td>
<td>

<pre><code>\ This shows a backslash</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - literal backslash</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\This is a literal backslash at the start of text

</td>
</tr>
<tr>
<td>

<pre><code>\This is a literal backslash at the start of text</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - html entities</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

HTML entities: &amp; &lt; &gt; &quot; &apos;

</td>
<td>

HTML entities: & < > " '

</td>
</tr>
<tr>
<td>

<pre><code>HTML entities: &amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;apos;</code></pre>

</td>
<td>

<pre><code>HTML entities: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - literal special characters</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Literal characters: & < > " '

</td>
</tr>
<tr>
<td>

<pre><code>Literal characters: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - literal markers in code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

`*These are literal asterisks*`

</td>
</tr>
<tr>
<td>

<pre><code>`*These are literal asterisks*`</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - literal link syntax in code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

`[This is a literal bracket notation](not a link)`

</td>
</tr>
<tr>
<td>

<pre><code>`[This is a literal bracket notation](not a link)`</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - literal html in code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

`<html>This looks like HTML but inside code</html>`

</td>
</tr>
<tr>
<td>

<pre><code>`&lt;html&gt;This looks like HTML but inside code&lt;/html&gt;`</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped asterisk in italic</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

*Italic text with \* escaped asterisk*

</td>
</tr>
<tr>
<td>

<pre><code>*Italic text with \* escaped asterisk*</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped asterisks in bold</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

**Bold text with \** escaped asterisks**

</td>
<td>

*Bold text with \* escaped asterisks*\*

</td>
</tr>
<tr>
<td>

<pre><code>**Bold text with \** escaped asterisks**</code></pre>

</td>
<td>

<pre><code>*Bold text with \* escaped asterisks*\*</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped bracket in link</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

[Link with \[ escaped bracket](https://example.com)

</td>
</tr>
<tr>
<td>

<pre><code>[Link with \[ escaped bracket](https://example.com)</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped characters in code block</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

```
Code block with \* escaped asterisk
And a \`escaped backtick\`
```

</td>
</tr>
<tr>
<td>

<pre><code>```
Code block with \* escaped asterisk
And a \`escaped backtick\`
```</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped marker in blockquote</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> Blockquote with \> escaped angle bracket

</td>
<td>

> Blockquote with > escaped angle bracket

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Blockquote with \&gt; escaped angle bracket</code></pre>

</td>
<td>

<pre><code>&gt; Blockquote with &gt; escaped angle bracket</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - multiple backslash escapes</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\\\*This shows a backslash followed by an escaped asterisk\\\*

</td>
</tr>
<tr>
<td>

<pre><code>\\\*This shows a backslash followed by an escaped asterisk\\\*</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - multiple backtick escapes</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

\\\`This shows a backslash followed by an escaped backtick\\\`

</td>
</tr>
<tr>
<td>

<pre><code>\\\`This shows a backslash followed by an escaped backtick\\\`</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - escaped url characters</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

[Link with escaped characters](https://example.com/\(parenthesis\))

</td>
</tr>
<tr>
<td>

<pre><code>[Link with escaped characters](https://example.com/\(parenthesis\))</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - encoded url characters</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

[Link with encoded characters](https://example.com/%28parenthesis%29)

</td>
</tr>
<tr>
<td>

<pre><code>[Link with encoded characters](https://example.com/%28parenthesis%29)</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-headings

## Test Summary

- 🟢 Perfect roundtrip (input = output): 12/16 (75%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 4/16 (25%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 0/16 (0%)

**Overall Status**: ✅ All tests passing (12 perfect, 4 acceptable)

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading level 1</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

# Heading level 1

</td>
</tr>
<tr>
<td>

<pre><code># Heading level 1</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading level 2</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

## Heading level 2

</td>
</tr>
<tr>
<td>

<pre><code>## Heading level 2</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading level 3</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

### Heading level 3

</td>
</tr>
<tr>
<td>

<pre><code>### Heading level 3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading level 4</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

#### Heading level 4

</td>
</tr>
<tr>
<td>

<pre><code>#### Heading level 4</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading level 5</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

##### Heading level 5

</td>
</tr>
<tr>
<td>

<pre><code>##### Heading level 5</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading level 6</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

###### Heading level 6

</td>
</tr>
<tr>
<td>

<pre><code>###### Heading level 6</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - alternative heading level 1</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Alternative Heading level 1
===========================

</td>
<td>

# Alternative Heading level 1

</td>
<td>

# Alternative Heading level 1

</td>
</tr>
<tr>
<td>

<pre><code>Alternative Heading level 1
===========================</code></pre>

</td>
<td>

<pre><code># Alternative Heading level 1</code></pre>

</td>
<td>

<pre><code># Alternative Heading level 1</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - alternative heading level 2</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Alternative Heading level 2
--------------------------

</td>
<td>

## Alternative Heading level 2

</td>
<td>

## Alternative Heading level 2

</td>
</tr>
<tr>
<td>

<pre><code>Alternative Heading level 2
--------------------------</code></pre>

</td>
<td>

<pre><code>## Alternative Heading level 2</code></pre>

</td>
<td>

<pre><code>## Alternative Heading level 2</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading with emphasis</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

# Heading with *emphasis*

</td>
</tr>
<tr>
<td>

<pre><code># Heading with *emphasis*</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading with strong</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

## Heading with **strong**

</td>
</tr>
<tr>
<td>

<pre><code>## Heading with **strong**</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading with strikethrough</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

### Heading with ~~strikethrough~~

</td>
</tr>
<tr>
<td>

<pre><code>### Heading with ~~strikethrough~~</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading with code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

#### Heading with `code`

</td>
</tr>
<tr>
<td>

<pre><code>#### Heading with `code`</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading with link</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

##### Heading with [link](https://example.com)

</td>
</tr>
<tr>
<td>

<pre><code>##### Heading with [link](https://example.com)</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading with mixed formatting</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

###### Heading with mixed **bold** and *italic*

</td>
</tr>
<tr>
<td>

<pre><code>###### Heading with mixed **bold** and *italic*</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - heading without blank line after</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

# Heading followed by paragraph
This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)

</td>
<td>

# Heading followed by paragraph

This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)

</td>
<td>

# Heading followed by paragraph

This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)

</td>
</tr>
<tr>
<td>

<pre><code># Heading followed by paragraph
This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)</code></pre>

</td>
<td>

<pre><code># Heading followed by paragraph

This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)</code></pre>

</td>
<td>

<pre><code># Heading followed by paragraph

This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - heading with trailing whitespace</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

# Heading with trailing whitespace   
Next line content. (we expect it to get an extra break)

</td>
<td>

# Heading with trailing whitespace

Next line content. (we expect it to get an extra break)

</td>
<td>

# Heading with trailing whitespace

Next line content. (we expect it to get an extra break)

</td>
</tr>
<tr>
<td>

<pre><code># Heading with trailing whitespace   
Next line content. (we expect it to get an extra break)</code></pre>

</td>
<td>

<pre><code># Heading with trailing whitespace

Next line content. (we expect it to get an extra break)</code></pre>

</td>
<td>

<pre><code># Heading with trailing whitespace

Next line content. (we expect it to get an extra break)</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-horizontal-rules

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# Horizontal Rules

Paragraph before horizontal rule.

---

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

___

Paragraph between horizontal rules.

- - -

Paragraph between horizontal rules.

* * *

Paragraph between horizontal rules.

_ _ _

Paragraph after horizontal rule.

Text
---
Text right after horizontal rule (or is this an alternative heading?)

Text right before horizontal rule
---

---
Text right after horizontal rule without paragraph spacing

</td>
<td>

# Horizontal Rules

Paragraph before horizontal rule.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph after horizontal rule.

## Text

Text right after horizontal rule (or is this an alternative heading?)

## Text right before horizontal rule

***

Text right after horizontal rule without paragraph spacing


</td>
</tr>
<tr>
<td>

<pre><code># Horizontal Rules

Paragraph before horizontal rule.

---

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

___

Paragraph between horizontal rules.

- - -

Paragraph between horizontal rules.

* * *

Paragraph between horizontal rules.

_ _ _

Paragraph after horizontal rule.

Text
---
Text right after horizontal rule (or is this an alternative heading?)

Text right before horizontal rule
---

---
Text right after horizontal rule without paragraph spacing</code></pre>

</td>
<td>

<pre><code># Horizontal Rules

Paragraph before horizontal rule.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

***

Paragraph after horizontal rule.

## Text

Text right after horizontal rule (or is this an alternative heading?)

## Text right before horizontal rule

***

Text right after horizontal rule without paragraph spacing
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-html

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# HTML in Markdown

<!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer's
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
-->

## Inline HTML

This paragraph contains <em>inline HTML</em> elements.

This paragraph contains <strong>bold text</strong> using HTML.

This paragraph has a <a href="https://example.com">link</a> using HTML.

This paragraph has <span style="color: red;">styled text</span> using HTML.

This paragraph has a line break using HTML.<br>This is on a new line.

## Block HTML

<div style="background-color: #f0f0f0; padding: 10px;">
  <h3>HTML Block</h3>
  <p>This is a paragraph inside an HTML block.</p>
  <ul>
    <li>List item 1</li>
    <li>List item 2</li>
  </ul>
</div>

## HTML Tables

<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
    <tr>
      <td>Cell 3</td>
      <td>Cell 4</td>
    </tr>
  </tbody>
</table>

## HTML and Markdown Mixed

<div>
  
### Markdown Heading Inside HTML

- List item 1
- List item 2

</div>

## HTML Comments

<!-- This is an HTML comment that shouldn't be visible in the rendered output -->

Text before comment <!-- Inline comment --> text after comment.

## Void HTML Elements

<hr>

Text with <br> line break.

<img src="https://example.com/image.jpg" alt="Example Image">

## HTML with Attributes

<a href="https://example.com" title="Example Website" target="_blank" rel="noopener noreferrer">Link with attributes</a>

<div id="unique-id" class="custom-class" data-custom="value">
  Div with multiple attributes
</div>

## IFrames and Embeds

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## HTML Forms

<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name"><br>
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email"><br>
  
  <input type="submit" value="Submit">
</form>

## Scripts (might be stripped by some parsers)

<script>
  function sayHello() {
    alert('Hello, world!');
  }
</script>

<button onclick="sayHello()">Click me</button>

## HTML with CSS

<style>
  .custom-text {
    color: blue;
    font-weight: bold;
  }
</style>

<p class="custom-text">This text might be styled if CSS is allowed.</p>

</td>
<td>

# HTML in Markdown

<!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer's
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
-->

## Inline HTML

This paragraph contains <em>inline HTML</em> elements.

This paragraph contains <strong>bold text</strong> using HTML.

This paragraph has a <a href="https://example.com">link</a> using HTML.

This paragraph has <span style="color: red;">styled text</span> using HTML.

This paragraph has a line break using HTML.<br />This is on a new line.

## Block HTML

<div style="background-color: #f0f0f0; padding: 10px;">
  <h3>HTML Block</h3>
  <p>This is a paragraph inside an HTML block.</p>
  <ul>
    <li>List item 1</li>
    <li>List item 2</li>
  </ul>
</div>

## HTML Tables

<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
    <tr>
      <td>Cell 3</td>
      <td>Cell 4</td>
    </tr>
  </tbody>
</table>

## HTML and Markdown Mixed

<div>

### Markdown Heading Inside HTML

* List item 1

* List item 2

</div>

## HTML Comments

<!-- This is an HTML comment that shouldn't be visible in the rendered output -->

Text before comment <!-- Inline comment --> text after comment.

## Void HTML Elements

<hr>

Text with <br /> line break.

<img src="https://example.com/image.jpg" alt="Example Image">

## HTML with Attributes

<a href="https://example.com" title="Example Website" target="_blank" rel="noopener noreferrer">Link with attributes</a>

<div id="unique-id" class="custom-class" data-custom="value">
  Div with multiple attributes
</div>

## IFrames and Embeds

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## HTML Forms

<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name"><br />

<label for="email">Email:</label> <input type="email" id="email" name="email"><br />

  <input type="submit" value="Submit">
</form>

## Scripts (might be stripped by some parsers)

<script>
  function sayHello() {
    alert('Hello, world!');
  }
</script>

<button onclick="sayHello()">Click me</button>

## HTML with CSS

<style>
  .custom-text {
    color: blue;
    font-weight: bold;
  }
</style>

<p class="custom-text">This text might be styled if CSS is allowed.</p>


</td>
</tr>
<tr>
<td>

<pre><code># HTML in Markdown

&lt;!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer&#039;s
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
--&gt;

## Inline HTML

This paragraph contains &lt;em&gt;inline HTML&lt;/em&gt; elements.

This paragraph contains &lt;strong&gt;bold text&lt;/strong&gt; using HTML.

This paragraph has a &lt;a href=&quot;https://example.com&quot;&gt;link&lt;/a&gt; using HTML.

This paragraph has &lt;span style=&quot;color: red;&quot;&gt;styled text&lt;/span&gt; using HTML.

This paragraph has a line break using HTML.&lt;br&gt;This is on a new line.

## Block HTML

&lt;div style=&quot;background-color: #f0f0f0; padding: 10px;&quot;&gt;
  &lt;h3&gt;HTML Block&lt;/h3&gt;
  &lt;p&gt;This is a paragraph inside an HTML block.&lt;/p&gt;
  &lt;ul&gt;
    &lt;li&gt;List item 1&lt;/li&gt;
    &lt;li&gt;List item 2&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;

## HTML Tables

&lt;table&gt;
  &lt;thead&gt;
    &lt;tr&gt;
      &lt;th&gt;Column 1&lt;/th&gt;
      &lt;th&gt;Column 2&lt;/th&gt;
    &lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 1&lt;/td&gt;
      &lt;td&gt;Cell 2&lt;/td&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 3&lt;/td&gt;
      &lt;td&gt;Cell 4&lt;/td&gt;
    &lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;

## HTML and Markdown Mixed

&lt;div&gt;
  
### Markdown Heading Inside HTML

- List item 1
- List item 2

&lt;/div&gt;

## HTML Comments

&lt;!-- This is an HTML comment that shouldn&#039;t be visible in the rendered output --&gt;

Text before comment &lt;!-- Inline comment --&gt; text after comment.

## Void HTML Elements

&lt;hr&gt;

Text with &lt;br&gt; line break.

&lt;img src=&quot;https://example.com/image.jpg&quot; alt=&quot;Example Image&quot;&gt;

## HTML with Attributes

&lt;a href=&quot;https://example.com&quot; title=&quot;Example Website&quot; target=&quot;_blank&quot; rel=&quot;noopener noreferrer&quot;&gt;Link with attributes&lt;/a&gt;

&lt;div id=&quot;unique-id&quot; class=&quot;custom-class&quot; data-custom=&quot;value&quot;&gt;
  Div with multiple attributes
&lt;/div&gt;

## IFrames and Embeds

&lt;iframe width=&quot;560&quot; height=&quot;315&quot; src=&quot;https://www.youtube.com/embed/dQw4w9WgXcQ&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture&quot; allowfullscreen&gt;&lt;/iframe&gt;

## HTML Forms

&lt;form action=&quot;/submit&quot; method=&quot;post&quot;&gt;
  &lt;label for=&quot;name&quot;&gt;Name:&lt;/label&gt;
  &lt;input type=&quot;text&quot; id=&quot;name&quot; name=&quot;name&quot;&gt;&lt;br&gt;
  
  &lt;label for=&quot;email&quot;&gt;Email:&lt;/label&gt;
  &lt;input type=&quot;email&quot; id=&quot;email&quot; name=&quot;email&quot;&gt;&lt;br&gt;
  
  &lt;input type=&quot;submit&quot; value=&quot;Submit&quot;&gt;
&lt;/form&gt;

## Scripts (might be stripped by some parsers)

&lt;script&gt;
  function sayHello() {
    alert(&#039;Hello, world!&#039;);
  }
&lt;/script&gt;

&lt;button onclick=&quot;sayHello()&quot;&gt;Click me&lt;/button&gt;

## HTML with CSS

&lt;style&gt;
  .custom-text {
    color: blue;
    font-weight: bold;
  }
&lt;/style&gt;

&lt;p class=&quot;custom-text&quot;&gt;This text might be styled if CSS is allowed.&lt;/p&gt;</code></pre>

</td>
<td>

<pre><code># HTML in Markdown

&lt;!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer&#039;s
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
--&gt;

## Inline HTML

This paragraph contains &lt;em&gt;inline HTML&lt;/em&gt; elements.

This paragraph contains &lt;strong&gt;bold text&lt;/strong&gt; using HTML.

This paragraph has a &lt;a href=&quot;https://example.com&quot;&gt;link&lt;/a&gt; using HTML.

This paragraph has &lt;span style=&quot;color: red;&quot;&gt;styled text&lt;/span&gt; using HTML.

This paragraph has a line break using HTML.&lt;br /&gt;This is on a new line.

## Block HTML

&lt;div style=&quot;background-color: #f0f0f0; padding: 10px;&quot;&gt;
  &lt;h3&gt;HTML Block&lt;/h3&gt;
  &lt;p&gt;This is a paragraph inside an HTML block.&lt;/p&gt;
  &lt;ul&gt;
    &lt;li&gt;List item 1&lt;/li&gt;
    &lt;li&gt;List item 2&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;

## HTML Tables

&lt;table&gt;
  &lt;thead&gt;
    &lt;tr&gt;
      &lt;th&gt;Column 1&lt;/th&gt;
      &lt;th&gt;Column 2&lt;/th&gt;
    &lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 1&lt;/td&gt;
      &lt;td&gt;Cell 2&lt;/td&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 3&lt;/td&gt;
      &lt;td&gt;Cell 4&lt;/td&gt;
    &lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;

## HTML and Markdown Mixed

&lt;div&gt;

### Markdown Heading Inside HTML

* List item 1

* List item 2

&lt;/div&gt;

## HTML Comments

&lt;!-- This is an HTML comment that shouldn&#039;t be visible in the rendered output --&gt;

Text before comment &lt;!-- Inline comment --&gt; text after comment.

## Void HTML Elements

&lt;hr&gt;

Text with &lt;br /&gt; line break.

&lt;img src=&quot;https://example.com/image.jpg&quot; alt=&quot;Example Image&quot;&gt;

## HTML with Attributes

&lt;a href=&quot;https://example.com&quot; title=&quot;Example Website&quot; target=&quot;_blank&quot; rel=&quot;noopener noreferrer&quot;&gt;Link with attributes&lt;/a&gt;

&lt;div id=&quot;unique-id&quot; class=&quot;custom-class&quot; data-custom=&quot;value&quot;&gt;
  Div with multiple attributes
&lt;/div&gt;

## IFrames and Embeds

&lt;iframe width=&quot;560&quot; height=&quot;315&quot; src=&quot;https://www.youtube.com/embed/dQw4w9WgXcQ&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture&quot; allowfullscreen&gt;&lt;/iframe&gt;

## HTML Forms

&lt;form action=&quot;/submit&quot; method=&quot;post&quot;&gt;
  &lt;label for=&quot;name&quot;&gt;Name:&lt;/label&gt;
  &lt;input type=&quot;text&quot; id=&quot;name&quot; name=&quot;name&quot;&gt;&lt;br /&gt;

&lt;label for=&quot;email&quot;&gt;Email:&lt;/label&gt; &lt;input type=&quot;email&quot; id=&quot;email&quot; name=&quot;email&quot;&gt;&lt;br /&gt;

  &lt;input type=&quot;submit&quot; value=&quot;Submit&quot;&gt;
&lt;/form&gt;

## Scripts (might be stripped by some parsers)

&lt;script&gt;
  function sayHello() {
    alert(&#039;Hello, world!&#039;);
  }
&lt;/script&gt;

&lt;button onclick=&quot;sayHello()&quot;&gt;Click me&lt;/button&gt;

## HTML with CSS

&lt;style&gt;
  .custom-text {
    color: blue;
    font-weight: bold;
  }
&lt;/style&gt;

&lt;p class=&quot;custom-text&quot;&gt;This text might be styled if CSS is allowed.&lt;/p&gt;
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-images

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# Images

![Basic image](https://example.com/image.jpg)

![Image with alt text](https://example.com/image.jpg "Example Image")

![Image with *formatted* alt text](https://example.com/image.jpg)

[![Image with link](https://example.com/image.jpg)](https://example.com)

![Reference image][image-ref]

![Another reference image][image-ref]

![Reference image with different text][different-image-ref]

Paragraph with an ![inline image](https://example.com/image.jpg) in the middle.

Paragraph with *![formatted inline image](https://example.com/image.jpg)* in italics.

Paragraph with **![formatted inline image](https://example.com/image.jpg)** in bold.

![Image with empty source]()

![](https://example.com/image.jpg)

[image-ref]: https://example.com/ref-image.jpg "Reference Example Image"
[different-image-ref]: https://example.com/different-image.jpg "Different Reference Image"

</td>
<td>

# Images

![Basic image](https://example.com/image.jpg "Basic image")

![Image with alt text](https://example.com/image.jpg "Image with alt text")

![Image with formatted alt text](https://example.com/image.jpg "Image with formatted alt text")

[![Image with link](https://example.com/image.jpg "Image with link")](https://example.com)

Paragraph with an&#x20;

![inline image](https://example.com/image.jpg "inline image")

&#x20;in the middle.

Paragraph with&#x20;

![formatted inline image](https://example.com/image.jpg "formatted inline image")

&#x20;in italics.

Paragraph with&#x20;

![formatted inline image](https://example.com/image.jpg "formatted inline image")

&#x20;in bold.

![Image with empty source](<> "Image with empty source")

![](https://example.com/image.jpg)


</td>
</tr>
<tr>
<td>

<pre><code># Images

![Basic image](https://example.com/image.jpg)

![Image with alt text](https://example.com/image.jpg &quot;Example Image&quot;)

![Image with *formatted* alt text](https://example.com/image.jpg)

[![Image with link](https://example.com/image.jpg)](https://example.com)

![Reference image][image-ref]

![Another reference image][image-ref]

![Reference image with different text][different-image-ref]

Paragraph with an ![inline image](https://example.com/image.jpg) in the middle.

Paragraph with *![formatted inline image](https://example.com/image.jpg)* in italics.

Paragraph with **![formatted inline image](https://example.com/image.jpg)** in bold.

![Image with empty source]()

![](https://example.com/image.jpg)

[image-ref]: https://example.com/ref-image.jpg &quot;Reference Example Image&quot;
[different-image-ref]: https://example.com/different-image.jpg &quot;Different Reference Image&quot;</code></pre>

</td>
<td>

<pre><code># Images

![Basic image](https://example.com/image.jpg &quot;Basic image&quot;)

![Image with alt text](https://example.com/image.jpg &quot;Image with alt text&quot;)

![Image with formatted alt text](https://example.com/image.jpg &quot;Image with formatted alt text&quot;)

[![Image with link](https://example.com/image.jpg &quot;Image with link&quot;)](https://example.com)

Paragraph with an&amp;#x20;

![inline image](https://example.com/image.jpg &quot;inline image&quot;)

&amp;#x20;in the middle.

Paragraph with&amp;#x20;

![formatted inline image](https://example.com/image.jpg &quot;formatted inline image&quot;)

&amp;#x20;in italics.

Paragraph with&amp;#x20;

![formatted inline image](https://example.com/image.jpg &quot;formatted inline image&quot;)

&amp;#x20;in bold.

![Image with empty source](&lt;&gt; &quot;Image with empty source&quot;)

![](https://example.com/image.jpg)
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-links

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# Links

[Basic link](https://example.com)

[Link with title](https://example.com "Example Website")

[Link with formatting **bold**](https://example.com)

[Link with formatting *italic*](https://example.com)

[Link with formatting `code`](https://example.com)

<https://example.com> (Automatic link)

<email@example.com> (Email link)

[Reference link][ref]

[Another reference link][ref]

[Reference link with different text][different-ref]

[Shorthand reference]

Paragraph with a [link](https://example.com) in the middle.

Paragraph with *[formatted link](https://example.com)* in italics.

Paragraph with **[formatted link](https://example.com)** in bold.

[ref]: https://example.com "Reference Example"
[different-ref]: https://example.com/different "Different Reference"
[shorthand reference]: https://example.com

</td>
<td>

# Links

[Basic link](https://example.com)

[Link with title](https://example.com)

[Link with formatting **bold**](https://example.com)

[Link with formatting *italic*](https://example.com)

[Link with formatting `code`](https://example.com)

<https://example.com> (Automatic link)

<email@example.com> (Email link)

Paragraph with a [link](https://example.com) in the middle.

Paragraph with [*formatted link*](https://example.com) in italics.

Paragraph with [**formatted link**](https://example.com) in bold.


</td>
</tr>
<tr>
<td>

<pre><code># Links

[Basic link](https://example.com)

[Link with title](https://example.com &quot;Example Website&quot;)

[Link with formatting **bold**](https://example.com)

[Link with formatting *italic*](https://example.com)

[Link with formatting `code`](https://example.com)

&lt;https://example.com&gt; (Automatic link)

&lt;email@example.com&gt; (Email link)

[Reference link][ref]

[Another reference link][ref]

[Reference link with different text][different-ref]

[Shorthand reference]

Paragraph with a [link](https://example.com) in the middle.

Paragraph with *[formatted link](https://example.com)* in italics.

Paragraph with **[formatted link](https://example.com)** in bold.

[ref]: https://example.com &quot;Reference Example&quot;
[different-ref]: https://example.com/different &quot;Different Reference&quot;
[shorthand reference]: https://example.com</code></pre>

</td>
<td>

<pre><code># Links

[Basic link](https://example.com)

[Link with title](https://example.com)

[Link with formatting **bold**](https://example.com)

[Link with formatting *italic*](https://example.com)

[Link with formatting `code`](https://example.com)

&lt;https://example.com&gt; (Automatic link)

&lt;email@example.com&gt; (Email link)

Paragraph with a [link](https://example.com) in the middle.

Paragraph with [*formatted link*](https://example.com) in italics.

Paragraph with [**formatted link**](https://example.com) in bold.
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-lists

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/10 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/10 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 10/10 (100%)

**Overall Status**: ❌ 10 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">tc - simple unordered list</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

- Item 1
- Item 2
- Item 3

</td>
<td>

* Item 1

* Item 2

* Item 3

</td>
</tr>
<tr>
<td>

<pre><code>- Item 1
- Item 2
- Item 3</code></pre>

</td>
<td>

<pre><code>* Item 1

* Item 2

* Item 3</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - asterisk unordered list</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

* Alternative item 1
* Alternative item 2
* Alternative item 3

</td>
<td>

- Alternative item 1
- Alternative item 2
- Alternative item 3

</td>
<td>

* Alternative item 1

* Alternative item 2

* Alternative item 3

</td>
</tr>
<tr>
<td>

<pre><code>* Alternative item 1
* Alternative item 2
* Alternative item 3</code></pre>

</td>
<td>

<pre><code>- Alternative item 1
- Alternative item 2
- Alternative item 3</code></pre>

</td>
<td>

<pre><code>* Alternative item 1

* Alternative item 2

* Alternative item 3</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - plus unordered list</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

+ Another alternative item 1
+ Another alternative item 2
+ Another alternative item 3

</td>
<td>

- Another alternative item 1
- Another alternative item 2
- Another alternative item 3

</td>
<td>

* Another alternative item 1

* Another alternative item 2

* Another alternative item 3

</td>
</tr>
<tr>
<td>

<pre><code>+ Another alternative item 1
+ Another alternative item 2
+ Another alternative item 3</code></pre>

</td>
<td>

<pre><code>- Another alternative item 1
- Another alternative item 2
- Another alternative item 3</code></pre>

</td>
<td>

<pre><code>* Another alternative item 1

* Another alternative item 2

* Another alternative item 3</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - nested unordered lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

- Item 1
  - Nested item 1.1
  - Nested item 1.2
    - Deeply nested item 1.2.1
    - Deeply nested item 1.2.2
  - Nested item 1.3
- Item 2
  - Nested item 2.1
  - Nested item 2.2

</td>
<td>

* Item 1

  * Nested item 1.1

  * Nested item 1.2

    * Deeply nested item 1.2.1

    * Deeply nested item 1.2.2

  * Nested item 1.3

* Item 2

  * Nested item 2.1

  * Nested item 2.2

</td>
</tr>
<tr>
<td>

<pre><code>- Item 1
  - Nested item 1.1
  - Nested item 1.2
    - Deeply nested item 1.2.1
    - Deeply nested item 1.2.2
  - Nested item 1.3
- Item 2
  - Nested item 2.1
  - Nested item 2.2</code></pre>

</td>
<td>

<pre><code>* Item 1

  * Nested item 1.1

  * Nested item 1.2

    * Deeply nested item 1.2.1

    * Deeply nested item 1.2.2

  * Nested item 1.3

* Item 2

  * Nested item 2.1

  * Nested item 2.2</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - simple ordered list</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

1. First item
2. Second item
3. Third item

</td>
<td>

1. First item

2. Second item

3. Third item

</td>
</tr>
<tr>
<td>

<pre><code>1. First item
2. Second item
3. Third item</code></pre>

</td>
<td>

<pre><code>1. First item

2. Second item

3. Third item</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - nested ordered lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

1. First item
   1. Nested item 1.1
   2. Nested item 1.2
      1. Deeply nested item 1.2.1
      2. Deeply nested item 1.2.2
   3. Nested item 1.3
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2

</td>
<td>

1. First item

   1. Nested item 1.1

   2. Nested item 1.2

      1. Deeply nested item 1.2.1

      2. Deeply nested item 1.2.2

   3. Nested item 1.3

2. Second item

   1. Nested item 2.1

   2. Nested item 2.2

</td>
</tr>
<tr>
<td>

<pre><code>1. First item
   1. Nested item 1.1
   2. Nested item 1.2
      1. Deeply nested item 1.2.1
      2. Deeply nested item 1.2.2
   3. Nested item 1.3
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2</code></pre>

</td>
<td>

<pre><code>1. First item

   1. Nested item 1.1

   2. Nested item 1.2

      1. Deeply nested item 1.2.1

      2. Deeply nested item 1.2.2

   3. Nested item 1.3

2. Second item

   1. Nested item 2.1

   2. Nested item 2.2</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - mixed ordered and unordered lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

1. Ordered item 1
2. Ordered item 2
   - Unordered nested item 2.1
   - Unordered nested item 2.2
     1. Ordered deeply nested item 2.2.1
     2. Ordered deeply nested item 2.2.2
   - Unordered nested item 2.3
3. Ordered item 3

</td>
<td>

1. Ordered item 1

2. Ordered item 2

   * Unordered nested item 2.1

   * Unordered nested item 2.2

     1. Ordered deeply nested item 2.2.1

     2. Ordered deeply nested item 2.2.2

   * Unordered nested item 2.3

3. Ordered item 3

</td>
</tr>
<tr>
<td>

<pre><code>1. Ordered item 1
2. Ordered item 2
   - Unordered nested item 2.1
   - Unordered nested item 2.2
     1. Ordered deeply nested item 2.2.1
     2. Ordered deeply nested item 2.2.2
   - Unordered nested item 2.3
3. Ordered item 3</code></pre>

</td>
<td>

<pre><code>1. Ordered item 1

2. Ordered item 2

   * Unordered nested item 2.1

   * Unordered nested item 2.2

     1. Ordered deeply nested item 2.2.1

     2. Ordered deeply nested item 2.2.2

   * Unordered nested item 2.3

3. Ordered item 3</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - list items with formatting</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

- **Bold item**
- *Italic item*
- ~~Strikethrough item~~
- Item with `code`
- Item with [link](https://example.com)
- Item with *nested **formatting***

</td>
<td>

- **Bold item**
- _Italic item_
- ~~Strikethrough item~~
- Item with `code`
- Item with [link](https://example.com)
- Item with _nested **formatting**_

</td>
<td>

* **Bold item**

* *Italic item*

* \~~Strikethrough item~~

* Item with `code`

* Item with [link](https://example.com)

* Item with *nested **formatting***

</td>
</tr>
<tr>
<td>

<pre><code>- **Bold item**
- *Italic item*
- ~~Strikethrough item~~
- Item with `code`
- Item with [link](https://example.com)
- Item with *nested **formatting***</code></pre>

</td>
<td>

<pre><code>- **Bold item**
- _Italic item_
- ~~Strikethrough item~~
- Item with `code`
- Item with [link](https://example.com)
- Item with _nested **formatting**_</code></pre>

</td>
<td>

<pre><code>* **Bold item**

* *Italic item*

* \~~Strikethrough item~~

* Item with `code`

* Item with [link](https://example.com)

* Item with *nested **formatting***</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - list items with paragraphs</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

- First item

  Paragraph within the first list item.
  
  Another paragraph within the first list item.

- Second item

  Paragraph within the second list item.

</td>
<td>

- First item

  Paragraph within the first list item.

  Another paragraph within the first list item.

- Second item

  Paragraph within the second list item.

</td>
<td>

* First item

  Paragraph within the first list item.

  Another paragraph within the first list item.

* Second item

  Paragraph within the second list item.

</td>
</tr>
<tr>
<td>

<pre><code>- First item

  Paragraph within the first list item.
  
  Another paragraph within the first list item.

- Second item

  Paragraph within the second list item.</code></pre>

</td>
<td>

<pre><code>- First item

  Paragraph within the first list item.

  Another paragraph within the first list item.

- Second item

  Paragraph within the second list item.</code></pre>

</td>
<td>

<pre><code>* First item

  Paragraph within the first list item.

  Another paragraph within the first list item.

* Second item

  Paragraph within the second list item.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - task lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
- [ ] Another incomplete task

</td>
<td>

* \[x] Completed task

* \[ ] Incomplete task

* \[x] Another completed task

* \[ ] Another incomplete task

</td>
</tr>
<tr>
<td>

<pre><code>- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
- [ ] Another incomplete task</code></pre>

</td>
<td>

<pre><code>* \[x] Completed task

* \[ ] Incomplete task

* \[x] Another completed task

* \[ ] Another incomplete task</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-paragraphs

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaces  
which creates a line break.

This paragraph ends with a backslash\
which also creates a line break.

This paragraph has a <br> HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here's a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn't affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

> Blockquote paragraph.
>
> Another paragraph in the same blockquote.

1. List item paragraph.
   
   Second paragraph in the same list item, indented with 3 spaces.

-  List item with a line break  
   continuing on the next line.

For HTML processing, paragraph with <span style="color: red;">HTML</span> inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference[^1].

[^1]: This is the footnote content.

</td>
<td>

# Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaceswhich creates a line break.

This paragraph ends with a backslashwhich also creates a line break.

This paragraph has a <br /> HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here's a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn't affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

> Blockquote paragraph.Another paragraph in the same blockquote.

1. List item paragraph.

   Second paragraph in the same list item, indented with 3 spaces.

* List item with a line breakcontinuing on the next line.

For HTML processing, paragraph with <span style="color: red;">HTML</span> inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference\[^1].

\[^1]: This is the footnote content.


</td>
</tr>
<tr>
<td>

<pre><code># Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaces  
which creates a line break.

This paragraph ends with a backslash\
which also creates a line break.

This paragraph has a &lt;br&gt; HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here&#039;s a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn&#039;t affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

&gt; Blockquote paragraph.
&gt;
&gt; Another paragraph in the same blockquote.

1. List item paragraph.
   
   Second paragraph in the same list item, indented with 3 spaces.

-  List item with a line break  
   continuing on the next line.

For HTML processing, paragraph with &lt;span style=&quot;color: red;&quot;&gt;HTML&lt;/span&gt; inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference[^1].

[^1]: This is the footnote content.</code></pre>

</td>
<td>

<pre><code># Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaceswhich creates a line break.

This paragraph ends with a backslashwhich also creates a line break.

This paragraph has a &lt;br /&gt; HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here&#039;s a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn&#039;t affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

&gt; Blockquote paragraph.Another paragraph in the same blockquote.

1. List item paragraph.

   Second paragraph in the same list item, indented with 3 spaces.

* List item with a line breakcontinuing on the next line.

For HTML processing, paragraph with &lt;span style=&quot;color: red;&quot;&gt;HTML&lt;/span&gt; inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference\[^1].

\[^1]: This is the footnote content.
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: common-md-tables

## Test Summary

- 🟢 Perfect roundtrip (input = output): 4/8 (50%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/8 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 4/8 (50%)

**Overall Status**: ❌ 4 failing tests

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - basic table</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

</td>
</tr>
<tr>
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - table with alignment</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
| Left         |     Center     |         Right |

</td>
</tr>
<tr>
<td>

<pre><code>| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
| Left         |     Center     |         Right |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - table with formatting</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

| **Bold Header** | *Italic Header* | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell**   | *Italic Cell*   | ~~Strikethrough Cell~~   |
| `Code Cell`     | [Link](https://example.com) | ![Image](https://example.com/image.jpg) |

</td>
<td>

| **Bold Header** | _Italic Header_ | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell** | _Italic Cell_ | ~~Strikethrough Cell~~ |
| `Code Cell` | [Link](https://example.com) | ![Image](https://example.com/image.jpg) |

</td>
<td>

| **Bold Header** | *Italic Header* | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell**   | *Italic Cell*   | ~~Strikethrough Cell~~   |
| `Code Cell`     | [Link](https://example.com) |&#x20;

![Image](https://example.com/image.jpg "Image")

&#x20;|

</td>
</tr>
<tr>
<td>

<pre><code>| **Bold Header** | *Italic Header* | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell**   | *Italic Cell*   | ~~Strikethrough Cell~~   |
| `Code Cell`     | [Link](https://example.com) | ![Image](https://example.com/image.jpg) |</code></pre>

</td>
<td>

<pre><code>| **Bold Header** | _Italic Header_ | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell** | _Italic Cell_ | ~~Strikethrough Cell~~ |
| `Code Cell` | [Link](https://example.com) | ![Image](https://example.com/image.jpg) |</code></pre>

</td>
<td>

<pre><code>| **Bold Header** | *Italic Header* | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell**   | *Italic Cell*   | ~~Strikethrough Cell~~   |
| `Code Cell`     | [Link](https://example.com) |&amp;#x20;

![Image](https://example.com/image.jpg &quot;Image&quot;)

&amp;#x20;|</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - table with empty cells</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Content  |          | Content  |
|          | Content  |          |
| Content  | Content  | Content  |

</td>
</tr>
<tr>
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Content  |          | Content  |
|          | Content  |          |
| Content  | Content  | Content  |</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - table with varying column width</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1     | Data          | Long content that extends across multiple characters |
| 2     | More Data     | More long content in this cell                       |

</td>
</tr>
<tr>
<td>

<pre><code>| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1     | Data          | Long content that extends across multiple characters |
| 2     | More Data     | More long content in this cell                       |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - table with line breaks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 |
| -------- | -------- |
| Line 1<br>Line 2 | Line 1<br>Line 2 |
| Single Line | Single Line |

</td>
<td>

| Header 1 | Header 2 |
| -------- | -------- |
| Line 1<br />Line 2 | Line 1<br />Line 2 |
| Single Line | Single Line |

</td>
</tr>
<tr>
<td>

<pre><code>| Header 1 | Header 2 |
| -------- | -------- |
| Line 1&lt;br&gt;Line 2 | Line 1&lt;br&gt;Line 2 |
| Single Line | Single Line |</code></pre>

</td>
<td>

<pre><code>| Header 1 | Header 2 |
| -------- | -------- |
| Line 1&lt;br /&gt;Line 2 | Line 1&lt;br /&gt;Line 2 |
| Single Line | Single Line |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - table with escaped pipe characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

| Column with \| pipe | Regular column |
| ------------------ | -------------- |
| Data with \| pipe  | Regular data   |

</td>
<td>

| Column with \| pipe | Regular column |
| ------------------ | -------------- |
| Data with \| pipe | Regular data |

</td>
<td>

| Column with | pipe | Regular column |
| ------------------ | -------------- |
| Data with | pipe  | Regular data   |

</td>
</tr>
<tr>
<td>

<pre><code>| Column with \| pipe | Regular column |
| ------------------ | -------------- |
| Data with \| pipe  | Regular data   |</code></pre>

</td>
<td>

<pre><code>| Column with \| pipe | Regular column |
| ------------------ | -------------- |
| Data with \| pipe | Regular data |</code></pre>

</td>
<td>

<pre><code>| Column with | pipe | Regular column |
| ------------------ | -------------- |
| Data with | pipe  | Regular data   |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - simplified table syntax</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Header 1 | Header 2
-------- | --------
Cell 1   | Cell 2
Cell 3   | Cell 4

</td>
<td>

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |

</td>
<td>

Header 1 | Header 2
\-------- | --------
Cell 1   | Cell 2
Cell 3   | Cell 4

</td>
</tr>
<tr>
<td>

<pre><code>Header 1 | Header 2
-------- | --------
Cell 1   | Cell 2
Cell 3   | Cell 4</code></pre>

</td>
<td>

<pre><code>| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |</code></pre>

</td>
<td>

<pre><code>Header 1 | Header 2
\-------- | --------
Cell 1   | Cell 2
Cell 3   | Cell 4</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: formatted-table

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Data 2   |
| Row 2    | Data 3   | Data 4   |



test

</td>
<td>

# Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Data 2   |
| Row 2    | Data 3   | Data 4   |

test


</td>
</tr>
<tr>
<td>

<pre><code># Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Data 2   |
| Row 2    | Data 3   | Data 4   |



test</code></pre>

</td>
<td>

<pre><code># Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Data 2   |
| Row 2    | Data 3   | Data 4   |

test
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: html-tags

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/1 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/1 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/1 (100%)

**Overall Status**: ❌ 1 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">Document</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

# Markdown with inline html

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works _perfectly fine_

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works _perfectly fine_

# markdown with block html element

# hello

<h1> hello </h1>

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/91317568?s=64&v=4" alt="opral icon">
  <p align="center">
    <a href='https://twitter.com/opralHQ' target="_blank">𝕏 Twitter</a>
    ·
    <a href='https://discord.gg/gdMPPWy57R' target="_blank">💬 Discord</a>
  </p>
</p>

test

# inline html in list

- 📦 **Import/Export**: Import and export messages in different file formats.
- <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> **Change control**: Collaboration, change proposals, reviews, and automation.

# random

<details>
<summary>yo</summary>

- asdasdsad
- asdasdasdasd
- asdasdsad
</details>


</td>
<td>

# Markdown with inline html

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works *perfectly fine*

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works *perfectly fine*

# markdown with block html element

# hello

<h1> hello </h1>

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/91317568?s=64&v=4" alt="opral icon">
  <p align="center">
    <a href='https://twitter.com/opralHQ' target="_blank">𝕏 Twitter</a>
    ·
    <a href='https://discord.gg/gdMPPWy57R' target="_blank">💬 Discord</a>
  </p>
</p>

test

# inline html in list

* 📦 **Import/Export**: Import and export messages in different file formats.

* <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> **Change control**: Collaboration, change proposals, reviews, and automation.

# random

<details>
<summary>yo</summary>

* asdasdsad

* asdasdasdasd

* asdasdsad

</details>


</td>
</tr>
<tr>
<td>

<pre><code># Markdown with inline html

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works _perfectly fine_

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works _perfectly fine_

# markdown with block html element

# hello

&lt;h1&gt; hello &lt;/h1&gt;

&lt;p align=&quot;center&quot;&gt;
  &lt;img src=&quot;https://avatars.githubusercontent.com/u/91317568?s=64&amp;v=4&quot; alt=&quot;opral icon&quot;&gt;
  &lt;p align=&quot;center&quot;&gt;
    &lt;a href=&#039;https://twitter.com/opralHQ&#039; target=&quot;_blank&quot;&gt;𝕏 Twitter&lt;/a&gt;
    ·
    &lt;a href=&#039;https://discord.gg/gdMPPWy57R&#039; target=&quot;_blank&quot;&gt;💬 Discord&lt;/a&gt;
  &lt;/p&gt;
&lt;/p&gt;

test

# inline html in list

- 📦 **Import/Export**: Import and export messages in different file formats.
- &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; **Change control**: Collaboration, change proposals, reviews, and automation.

# random

&lt;details&gt;
&lt;summary&gt;yo&lt;/summary&gt;

- asdasdsad
- asdasdasdasd
- asdasdsad
&lt;/details&gt;
</code></pre>

</td>
<td>

<pre><code># Markdown with inline html

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works *perfectly fine*

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works *perfectly fine*

# markdown with block html element

# hello

&lt;h1&gt; hello &lt;/h1&gt;

&lt;p align=&quot;center&quot;&gt;
  &lt;img src=&quot;https://avatars.githubusercontent.com/u/91317568?s=64&amp;v=4&quot; alt=&quot;opral icon&quot;&gt;
  &lt;p align=&quot;center&quot;&gt;
    &lt;a href=&#039;https://twitter.com/opralHQ&#039; target=&quot;_blank&quot;&gt;𝕏 Twitter&lt;/a&gt;
    ·
    &lt;a href=&#039;https://discord.gg/gdMPPWy57R&#039; target=&quot;_blank&quot;&gt;💬 Discord&lt;/a&gt;
  &lt;/p&gt;
&lt;/p&gt;

test

# inline html in list

* 📦 **Import/Export**: Import and export messages in different file formats.

* &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; **Change control**: Collaboration, change proposals, reviews, and automation.

# random

&lt;details&gt;
&lt;summary&gt;yo&lt;/summary&gt;

* asdasdsad

* asdasdasdasd

* asdasdsad

&lt;/details&gt;
</code></pre>

</td>
</tr>
</table>

</details>

---

# Test File: simple-md

## Test Summary

- 🟢 Perfect roundtrip (input = output): 5/6 (83%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/6 (17%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 0/6 (0%)

**Overall Status**: ✅ All tests passing (5 perfect, 1 acceptable)

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading 1</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

# Test H1

</td>
</tr>
<tr>
<td>

<pre><code># Test H1</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading 2</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

## Test H2

</td>
</tr>
<tr>
<td>

<pre><code>## Test H2</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading 3</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

### Test H3

</td>
</tr>
<tr>
<td>

<pre><code>### Test H3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - heading 4</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

#### Test H4

</td>
</tr>
<tr>
<td>

<pre><code>#### Test H4</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - normal paragraph</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

normal paragraph

</td>
</tr>
<tr>
<td>

<pre><code>normal paragraph</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraph with line breaks</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

new paragraph by two line feeds 
new paragraph by extra space at the end
collapsed break
should become a space

</td>
<td>

new paragraph by two line feeds
new paragraph by extra space at the end
collapsed break
should become a space

</td>
<td>

new paragraph by two line feeds
new paragraph by extra space at the end
collapsed break
should become a space

</td>
</tr>
<tr>
<td>

<pre><code>new paragraph by two line feeds 
new paragraph by extra space at the end
collapsed break
should become a space</code></pre>

</td>
<td>

<pre><code>new paragraph by two line feeds
new paragraph by extra space at the end
collapsed break
should become a space</code></pre>

</td>
<td>

<pre><code>new paragraph by two line feeds
new paragraph by extra space at the end
collapsed break
should become a space</code></pre>

</td>
</tr>
</table>

</details>

---

