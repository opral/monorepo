# Diff Results for common-md-line-breaks

## Test Summary

- 🟢 Perfect roundtrip (input = output): 7/13 (54%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 6/13 (46%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 0/13 (0%)

**Overall Status**: ✅ All tests passing (7 perfect, 6 acceptable)

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line breaks</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Paragraphs are separated by blank lines.

</td>
</tr>
<tr>
<td>

<pre><code>Paragraphs are separated by blank lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraphs and line break - 2 spaces + break</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph has a line break  
created with two trailing spaces.

</td>
<td>

This paragraph has a line break<br />created with two trailing spaces.

</td>
<td>

This paragraph has a line break<br />created with two trailing spaces.

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph has a line break  
created with two trailing spaces.</code></pre>

</td>
<td>

<pre><code>This paragraph has a line break&lt;br /&gt;created with two trailing spaces.</code></pre>

</td>
<td>

<pre><code>This paragraph has a line break&lt;br /&gt;created with two trailing spaces.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraphs and line break - backslash + break</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This one has a line break\
created with a backslash.

</td>
<td>

This one has a line break<br />created with a backslash.

</td>
<td>

This one has a line break<br />created with a backslash.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break\
created with a backslash.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;created with a backslash.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;created with a backslash.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraphs and line break - non mdx br tag</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This one has a line break<br>created with a html break tag.

</td>
<td>

This one has a line break<br />created with a html break tag.

</td>
<td>

This one has a line break<br />created with a html break tag.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br&gt;created with a html break tag.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;created with a html break tag.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;created with a html break tag.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line break - br tag</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This one has a line break<br />created with a xhtml break tag.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br /&gt;created with a xhtml break tag.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line break - br + linebreak</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This one has a line break<br />
created with a break tag and a new line.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br /&gt;
created with a break tag and a new line.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line break - 2x linebreak</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This one has a two line breaks

created with a break tag and two new lines.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a two line breaks

created with a break tag and two new lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraphs and line break - br + 2x linebreak</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This one has a break tag at the end of a paragraph which should be gone<br />

created with a two new lines.

</td>
<td>

This one has a break tag at the end of a paragraph which should be gone

created with a two new lines.

</td>
<td>

This one has a break tag at the end of a paragraph which should be gone

created with a two new lines.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a break tag at the end of a paragraph which should be gone&lt;br /&gt;

created with a two new lines.</code></pre>

</td>
<td>

<pre><code>This one has a break tag at the end of a paragraph which should be gone

created with a two new lines.</code></pre>

</td>
<td>

<pre><code>This one has a break tag at the end of a paragraph which should be gone

created with a two new lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line break - br, br + 2x linebreak</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This one has a line break<br /><br />

created with a break tag and two new lines.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br /&gt;&lt;br /&gt;

created with a break tag and two new lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line break - br, br, br + 2x linebreak</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This one has a line break<br /><br /><br />

created with a break tag and two new lines.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br /&gt;&lt;br /&gt;&lt;br /&gt;

created with a break tag and two new lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraphs and line break - br + 2 spaces + linebreak</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This one has a line break<br />  
created with a break tag followed by a space and new lines.

</td>
<td>

This one has a line break<br /><br />created with a break tag followed by a space and new lines.

</td>
<td>

This one has a line break<br /><br />created with a break tag followed by a space and new lines.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br /&gt;  
created with a break tag followed by a space and new lines.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;&lt;br /&gt;created with a break tag followed by a space and new lines.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;&lt;br /&gt;created with a break tag followed by a space and new lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - paragraphs and line break - br + backslash + linebreak</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This one has a line break<br />\
created with a break tag followed by a space and new lines.

</td>
<td>

This one has a line break<br /><br />created with a break tag followed by a space and new lines.

</td>
<td>

This one has a line break<br /><br />created with a break tag followed by a space and new lines.

</td>
</tr>
<tr>
<td>

<pre><code>This one has a line break&lt;br /&gt;\
created with a break tag followed by a space and new lines.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;&lt;br /&gt;created with a break tag followed by a space and new lines.</code></pre>

</td>
<td>

<pre><code>This one has a line break&lt;br /&gt;&lt;br /&gt;created with a break tag followed by a space and new lines.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - paragraphs and line break - simple paragraph</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

And another one to check if it worked

</td>
</tr>
<tr>
<td>

<pre><code>And another one to check if it worked</code></pre>

</td>
</tr>
</table>

</details>

