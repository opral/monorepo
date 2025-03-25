# Diff Results for common-md-headings

## Test Summary

- 🟢 Perfect roundtrip (input = output): 9/16 (56%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 6/16 (38%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/16 (6%)

**Overall Status**: ❌ 1 failing tests

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
<summary><span style="color:#cc7700; font-weight:bold;">tc - heading with emphasis</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

# Heading with *emphasis*

</td>
<td>

# Heading with _emphasis_

</td>
<td>

# Heading with _emphasis_

</td>
</tr>
<tr>
<td>

<pre><code># Heading with *emphasis*</code></pre>

</td>
<td>

<pre><code># Heading with _emphasis_</code></pre>

</td>
<td>

<pre><code># Heading with _emphasis_</code></pre>

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

<details open>
<summary><span style="color:red; font-weight:bold;">tc - heading with strikethrough</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

### Heading with ~~strikethrough~~

</td>
<td>

### Heading with 
~~strikethrough~~

</td>
</tr>
<tr>
<td>

<pre><code>### Heading with ~~strikethrough~~</code></pre>

</td>
<td>

<pre><code>### Heading with 
~~strikethrough~~</code></pre>

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
<summary><span style="color:#cc7700; font-weight:bold;">tc - heading with mixed formatting</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

###### Heading with mixed **bold** and *italic*

</td>
<td>

###### Heading with mixed **bold** and _italic_

</td>
<td>

###### Heading with mixed **bold** and _italic_

</td>
</tr>
<tr>
<td>

<pre><code>###### Heading with mixed **bold** and *italic*</code></pre>

</td>
<td>

<pre><code>###### Heading with mixed **bold** and _italic_</code></pre>

</td>
<td>

<pre><code>###### Heading with mixed **bold** and _italic_</code></pre>

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

