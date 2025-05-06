# Diff Results for simple-md

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

