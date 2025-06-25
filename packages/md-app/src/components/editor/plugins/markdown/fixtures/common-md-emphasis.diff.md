# Diff Results for common-md-emphasis

## Test Summary

- 🟢 Perfect roundtrip (input = output): 3/11 (27%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 8/11 (73%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 0/11 (0%)

**Overall Status**: ✅ All tests passing (3 perfect, 8 acceptable)

---

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - italic with asterisks</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

*Italic text* using single asterisks.

</td>
<td>

_Italic text_ using single asterisks.

</td>
<td>

_Italic text_ using single asterisks.

</td>
</tr>
<tr>
<td>

<pre><code>*Italic text* using single asterisks.</code></pre>

</td>
<td>

<pre><code>_Italic text_ using single asterisks.</code></pre>

</td>
<td>

<pre><code>_Italic text_ using single asterisks.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - italic with underscores</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

_Italic text_ using single underscores.

</td>
</tr>
<tr>
<td>

<pre><code>_Italic text_ using single underscores.</code></pre>

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
<summary><span style="color:#cc7700; font-weight:bold;">tc - bold-italic with asterisks</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

***Bold and italic*** using triple asterisks.

</td>
<td>

_**Bold and italic**_ using triple asterisks.

</td>
<td>

_**Bold and italic**_ using triple asterisks.

</td>
</tr>
<tr>
<td>

<pre><code>***Bold and italic*** using triple asterisks.</code></pre>

</td>
<td>

<pre><code>_**Bold and italic**_ using triple asterisks.</code></pre>

</td>
<td>

<pre><code>_**Bold and italic**_ using triple asterisks.</code></pre>

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

_**Bold and italic**_ using triple underscores.

</td>
<td>

_**Bold and italic**_ using triple underscores.

</td>
</tr>
<tr>
<td>

<pre><code>___Bold and italic___ using triple underscores.</code></pre>

</td>
<td>

<pre><code>_**Bold and italic**_ using triple underscores.</code></pre>

</td>
<td>

<pre><code>_**Bold and italic**_ using triple underscores.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - mixed formatting inline - nested</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

**Bold text with *italic* inside**.

</td>
<td>

**Bold text with _italic_** **inside**.

</td>
<td>

**Bold text with _italic_** **inside**.

</td>
</tr>
<tr>
<td>

<pre><code>**Bold text with *italic* inside**.</code></pre>

</td>
<td>

<pre><code>**Bold text with _italic_** **inside**.</code></pre>

</td>
<td>

<pre><code>**Bold text with _italic_** **inside**.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - mixed formatting inline - not nested</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

**Bold text with** ***italic*** **not nested**.

</td>
<td>

**Bold text with** _**italic**_ **not nested**.

</td>
<td>

**Bold text with** _**italic**_ **not nested**.

</td>
</tr>
<tr>
<td>

<pre><code>**Bold text with** ***italic*** **not nested**.</code></pre>

</td>
<td>

<pre><code>**Bold text with** _**italic**_ **not nested**.</code></pre>

</td>
<td>

<pre><code>**Bold text with** _**italic**_ **not nested**.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - italic with bold inside</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

*Italic text with **bold** inside*.

</td>
<td>

_Italic text with **bold** inside_.

</td>
<td>

_Italic text with **bold** inside_.

</td>
</tr>
<tr>
<td>

<pre><code>*Italic text with **bold** inside*.</code></pre>

</td>
<td>

<pre><code>_Italic text with **bold** inside_.</code></pre>

</td>
<td>

<pre><code>_Italic text with **bold** inside_.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - strikethrough</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

~~Strikethrough text~~ using double tildes.

</td>
</tr>
<tr>
<td>

<pre><code>~~Strikethrough text~~ using double tildes.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - mixed styles in paragraph</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Mixed **bold** and *italic* and ~~strikethrough~~ in one paragraph.

</td>
<td>

Mixed **bold** and _italic_ and ~~strikethrough~~ in one paragraph.

</td>
<td>

Mixed **bold** and _italic_ and ~~strikethrough~~ in one paragraph.

</td>
</tr>
<tr>
<td>

<pre><code>Mixed **bold** and *italic* and ~~strikethrough~~ in one paragraph.</code></pre>

</td>
<td>

<pre><code>Mixed **bold** and _italic_ and ~~strikethrough~~ in one paragraph.</code></pre>

</td>
<td>

<pre><code>Mixed **bold** and _italic_ and ~~strikethrough~~ in one paragraph.</code></pre>

</td>
</tr>
</table>

</details>

