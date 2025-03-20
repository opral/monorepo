# Diff Results for common-md-tables

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/8 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 1/8 (13%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 7/8 (88%)

**Overall Status**: ❌ 7 failing tests

---

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - basic table</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

</td>
<td>

| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Cell 1| Cell 2| Cell 3 |
| Cell 4| Cell 5| Cell 6 |

</td>
<td>

| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Cell 1| Cell 2| Cell 3 |
| Cell 4| Cell 5| Cell 6 |

</td>
</tr>
<tr>
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |</code></pre>

</td>
<td>

<pre><code>| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Cell 1| Cell 2| Cell 3 |
| Cell 4| Cell 5| Cell 6 |</code></pre>

</td>
<td>

<pre><code>| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Cell 1| Cell 2| Cell 3 |
| Cell 4| Cell 5| Cell 6 |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - table with alignment</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
| Left         |     Center     |         Right |

</td>
<td>

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left | Center | Right |
| Left | Center | Right |

</td>
<td>

| Left-aligned| Center-aligned| Right-aligned |
| --- | --- | --- |
| Left| Center| Right |
| Left| Center| Right |

</td>
</tr>
<tr>
<td>

<pre><code>| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
| Left         |     Center     |         Right |</code></pre>

</td>
<td>

<pre><code>| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left | Center | Right |
| Left | Center | Right |</code></pre>

</td>
<td>

<pre><code>| Left-aligned| Center-aligned| Right-aligned |
| --- | --- | --- |
| Left| Center| Right |
| Left| Center| Right |</code></pre>

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

| **Bold Header**| _Italic Header_| ~~Strikethrough Header~~ |
| --- | --- | --- |
| **Bold Cell**| _Italic Cell_| ~~Strikethrough Cell~~ |
| `Code Cell`| [Link](https://example.com)| 
![Image](https://example.com/image.jpg)
 |

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

<pre><code>| **Bold Header**| _Italic Header_| ~~Strikethrough Header~~ |
| --- | --- | --- |
| **Bold Cell**| _Italic Cell_| ~~Strikethrough Cell~~ |
| `Code Cell`| [Link](https://example.com)| 
![Image](https://example.com/image.jpg)
 |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - table with empty cells</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Content  |          | Content  |
|          | Content  |          |
| Content  | Content  | Content  |

</td>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Content |  | Content |
|  | Content |  |
| Content | Content | Content |

</td>
<td>

| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Content| Content |
| Content |
| Content| Content| Content |

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
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Content |  | Content |
|  | Content |  |
| Content | Content | Content |</code></pre>

</td>
<td>

<pre><code>| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Content| Content |
| Content |
| Content| Content| Content |</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - table with varying column width</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1     | Data          | Long content that extends across multiple characters |
| 2     | More Data     | More long content in this cell                       |

</td>
<td>

| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1 | Data | Long content that extends across multiple characters |
| 2 | More Data | More long content in this cell |

</td>
<td>

| Short| Medium Column| Very Long Column Header That Takes Up A Lot Of Space |
| --- | --- | --- |
| 1| Data| Long content that extends across multiple characters |
| 2| More Data| More long content in this cell |

</td>
</tr>
<tr>
<td>

<pre><code>| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1     | Data          | Long content that extends across multiple characters |
| 2     | More Data     | More long content in this cell                       |</code></pre>

</td>
<td>

<pre><code>| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1 | Data | Long content that extends across multiple characters |
| 2 | More Data | More long content in this cell |</code></pre>

</td>
<td>

<pre><code>| Short| Medium Column| Very Long Column Header That Takes Up A Lot Of Space |
| --- | --- | --- |
| 1| Data| Long content that extends across multiple characters |
| 2| More Data| More long content in this cell |</code></pre>

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

| Header 1| Header 2 |
| --- | --- |
| Line 1<br><br>Line 2<br>| Line 1<br><br>Line 2<br> |
| Single Line| Single Line |

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

<pre><code>| Header 1| Header 2 |
| --- | --- |
| Line 1&lt;br&gt;&lt;br&gt;Line 2&lt;br&gt;| Line 1&lt;br&gt;&lt;br&gt;Line 2&lt;br&gt; |
| Single Line| Single Line |</code></pre>

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

| Column with | pipe| Regular column |
| --- | --- | --- |
| Data with | pipe| Regular data |

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

<pre><code>| Column with | pipe| Regular column |
| --- | --- | --- |
| Data with | pipe| Regular data |</code></pre>

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

| Header 1| Header 2 |
| --- | --- |
| Cell 1| Cell 2 |
| Cell 3| Cell 4 |

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

<pre><code>| Header 1| Header 2 |
| --- | --- |
| Cell 1| Cell 2 |
| Cell 3| Cell 4 |</code></pre>

</td>
</tr>
</table>

</details>

