# Diff Results for common-md-escaping

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/24 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 0/24 (0%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 24/24 (100%)

**Overall Status**: ❌ 24 failing tests

---

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped asterisks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\*This text is not in italics\*

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\*This text is not in italics\*</code></pre>

</td>
<td>

<pre><code></code></pre>

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



</td>
</tr>
<tr>
<td>

<pre><code>\**This text is not in bold**</code></pre>

</td>
<td>

<pre><code></code></pre>

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



</td>
</tr>
<tr>
<td>

<pre><code>\[This is not a link](https://example.com)</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped code backticks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\`This is not code\`

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\`This is not code\`</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped list number</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

1\. This is not a list item

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>1\. This is not a list item</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped list bullet</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\- This is not a list item

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\- This is not a list item</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped heading marker</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\# This is not a heading

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\# This is not a heading</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped blockquote marker</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\> This is not a blockquote

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\&gt; This is not a blockquote</code></pre>

</td>
<td>

<pre><code></code></pre>

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



</td>
</tr>
<tr>
<td>

<pre><code>\\ This shows a backslash</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - literal backslash</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\This is a literal backslash at the start of text

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\This is a literal backslash at the start of text</code></pre>

</td>
<td>

<pre><code></code></pre>

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



</td>
</tr>
<tr>
<td>

<pre><code>HTML entities: &amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;apos;</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - literal special characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

Literal characters: & < > " '

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>Literal characters: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - literal markers in code</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

`*These are literal asterisks*`

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>`*These are literal asterisks*`</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - literal link syntax in code</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

`[This is a literal bracket notation](not a link)`

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>`[This is a literal bracket notation](not a link)`</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - literal html in code</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

`<html>This looks like HTML but inside code</html>`

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>`&lt;html&gt;This looks like HTML but inside code&lt;/html&gt;`</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped asterisk in italic</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

*Italic text with \* escaped asterisk*

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>*Italic text with \* escaped asterisk*</code></pre>

</td>
<td>

<pre><code></code></pre>

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



</td>
</tr>
<tr>
<td>

<pre><code>**Bold text with \** escaped asterisks**</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped bracket in link</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

[Link with \[ escaped bracket](https://example.com)

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>[Link with \[ escaped bracket](https://example.com)</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped characters in code block</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

```
Code block with \* escaped asterisk
And a \`escaped backtick\`
```

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>```
Code block with \* escaped asterisk
And a \`escaped backtick\`
```</code></pre>

</td>
<td>

<pre><code></code></pre>

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



</td>
</tr>
<tr>
<td>

<pre><code>&gt; Blockquote with \&gt; escaped angle bracket</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - multiple backslash escapes</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\\\*This shows a backslash followed by an escaped asterisk\\\*

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\\\*This shows a backslash followed by an escaped asterisk\\\*</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - multiple backtick escapes</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\\\`This shows a backslash followed by an escaped backtick\\\`

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>\\\`This shows a backslash followed by an escaped backtick\\\`</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaped url characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

[Link with escaped characters](https://example.com/\(parenthesis\))

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>[Link with escaped characters](https://example.com/\(parenthesis\))</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - encoded url characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

[Link with encoded characters](https://example.com/%28parenthesis%29)

</td>
<td>



</td>
</tr>
<tr>
<td>

<pre><code>[Link with encoded characters](https://example.com/%28parenthesis%29)</code></pre>

</td>
<td>

<pre><code></code></pre>

</td>
</tr>
</table>

</details>

