# Diff Results for common-md-code

## Test Summary

- 🟢 Perfect roundtrip (input = output): 9/13 (69%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/13 (8%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 3/13 (23%)

**Overall Status**: ❌ 3 failing tests

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

<details open>
<summary><span style="color:red; font-weight:bold;">tc - code block with nested backticks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
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
<td>

this codeblock contains another

```
This code block contains triple backticks
```
nested code
```
```

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
<td>

<pre><code>this codeblock contains another

```
This code block contains triple backticks
```
nested code
```
```</code></pre>

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

<details open>
<summary><span style="color:red; font-weight:bold;">tc - code block with line break</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
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

<details open>
<summary><span style="color:red; font-weight:bold;">tc - code block with multiple empty lines</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
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

