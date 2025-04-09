# Diff Results for common-md-lists

## Test Summary

- 🟢 Perfect roundtrip (input = output): 0/10 (0%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 9/10 (90%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 1/10 (10%)

**Overall Status**: ❌ 1 failing tests

---

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - simple unordered list</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

- Item 1
- Item 2
- Item 3

</td>
<td>

*   Item 1
*   Item 2
*   Item 3

</td>
<td>

*   Item 1
*   Item 2
*   Item 3

</td>
</tr>
<tr>
<td>

<pre><code>- Item 1
- Item 2
- Item 3</code></pre>

</td>
<td>

<pre><code>*   Item 1
*   Item 2
*   Item 3</code></pre>

</td>
<td>

<pre><code>*   Item 1
*   Item 2
*   Item 3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - asterisk unordered list</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

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

*   Alternative item 1
*   Alternative item 2
*   Alternative item 3

</td>
<td>

*   Alternative item 1
*   Alternative item 2
*   Alternative item 3

</td>
</tr>
<tr>
<td>

<pre><code>* Alternative item 1
* Alternative item 2
* Alternative item 3</code></pre>

</td>
<td>

<pre><code>*   Alternative item 1
*   Alternative item 2
*   Alternative item 3</code></pre>

</td>
<td>

<pre><code>*   Alternative item 1
*   Alternative item 2
*   Alternative item 3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - plus unordered list</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

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

*   Another alternative item 1
*   Another alternative item 2
*   Another alternative item 3

</td>
<td>

*   Another alternative item 1
*   Another alternative item 2
*   Another alternative item 3

</td>
</tr>
<tr>
<td>

<pre><code>+ Another alternative item 1
+ Another alternative item 2
+ Another alternative item 3</code></pre>

</td>
<td>

<pre><code>*   Another alternative item 1
*   Another alternative item 2
*   Another alternative item 3</code></pre>

</td>
<td>

<pre><code>*   Another alternative item 1
*   Another alternative item 2
*   Another alternative item 3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - nested unordered lists</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
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

*   Item 1
    *   Nested item 1.1
    *   Nested item 1.2
        *   Deeply nested item 1.2.1
        *   Deeply nested item 1.2.2
    *   Nested item 1.3
*   Item 2
    *   Nested item 2.1
    *   Nested item 2.2

</td>
<td>

*   Item 1
    *   Nested item 1.1
    *   Nested item 1.2
        *   Deeply nested item 1.2.1
        *   Deeply nested item 1.2.2
    *   Nested item 1.3
*   Item 2
    *   Nested item 2.1
    *   Nested item 2.2

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

<pre><code>*   Item 1
    *   Nested item 1.1
    *   Nested item 1.2
        *   Deeply nested item 1.2.1
        *   Deeply nested item 1.2.2
    *   Nested item 1.3
*   Item 2
    *   Nested item 2.1
    *   Nested item 2.2</code></pre>

</td>
<td>

<pre><code>*   Item 1
    *   Nested item 1.1
    *   Nested item 1.2
        *   Deeply nested item 1.2.1
        *   Deeply nested item 1.2.2
    *   Nested item 1.3
*   Item 2
    *   Nested item 2.1
    *   Nested item 2.2</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - simple ordered list</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

1. First item
2. Second item
3. Third item

</td>
<td>

1.  First item
2.  Second item
3.  Third item

</td>
<td>

1.  First item
2.  Second item
3.  Third item

</td>
</tr>
<tr>
<td>

<pre><code>1. First item
2. Second item
3. Third item</code></pre>

</td>
<td>

<pre><code>1.  First item
2.  Second item
3.  Third item</code></pre>

</td>
<td>

<pre><code>1.  First item
2.  Second item
3.  Third item</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - nested ordered lists</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
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

1.  First item
    1.  Nested item 1.1
    2.  Nested item 1.2
        1.  Deeply nested item 1.2.1
        2.  Deeply nested item 1.2.2
    3.  Nested item 1.3
2.  Second item
    1.  Nested item 2.1
    2.  Nested item 2.2

</td>
<td>

1.  First item
    1.  Nested item 1.1
    2.  Nested item 1.2
        1.  Deeply nested item 1.2.1
        2.  Deeply nested item 1.2.2
    3.  Nested item 1.3
2.  Second item
    1.  Nested item 2.1
    2.  Nested item 2.2

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

<pre><code>1.  First item
    1.  Nested item 1.1
    2.  Nested item 1.2
        1.  Deeply nested item 1.2.1
        2.  Deeply nested item 1.2.2
    3.  Nested item 1.3
2.  Second item
    1.  Nested item 2.1
    2.  Nested item 2.2</code></pre>

</td>
<td>

<pre><code>1.  First item
    1.  Nested item 1.1
    2.  Nested item 1.2
        1.  Deeply nested item 1.2.1
        2.  Deeply nested item 1.2.2
    3.  Nested item 1.3
2.  Second item
    1.  Nested item 2.1
    2.  Nested item 2.2</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - mixed ordered and unordered lists</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
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

1.  Ordered item 1
2.  Ordered item 2
    *   Unordered nested item 2.1
    *   Unordered nested item 2.2
        1.  Ordered deeply nested item 2.2.1
        2.  Ordered deeply nested item 2.2.2
    *   Unordered nested item 2.3
3.  Ordered item 3

</td>
<td>

1.  Ordered item 1
2.  Ordered item 2
    *   Unordered nested item 2.1
    *   Unordered nested item 2.2
        1.  Ordered deeply nested item 2.2.1
        2.  Ordered deeply nested item 2.2.2
    *   Unordered nested item 2.3
3.  Ordered item 3

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

<pre><code>1.  Ordered item 1
2.  Ordered item 2
    *   Unordered nested item 2.1
    *   Unordered nested item 2.2
        1.  Ordered deeply nested item 2.2.1
        2.  Ordered deeply nested item 2.2.2
    *   Unordered nested item 2.3
3.  Ordered item 3</code></pre>

</td>
<td>

<pre><code>1.  Ordered item 1
2.  Ordered item 2
    *   Unordered nested item 2.1
    *   Unordered nested item 2.2
        1.  Ordered deeply nested item 2.2.1
        2.  Ordered deeply nested item 2.2.2
    *   Unordered nested item 2.3
3.  Ordered item 3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - list items with formatting</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

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

*   **Bold item**
*   *Italic item*
*   ~~Strikethrough item~~
*   Item with `code`
*   Item with [link](https://example.com)
*   Item with *nested **formatting***

</td>
<td>

*   **Bold item**
*   *Italic item*
*   ~~Strikethrough item~~
*   Item with `code`
*   Item with [link](https://example.com)
*   Item with *nested **formatting***

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

<pre><code>*   **Bold item**
*   *Italic item*
*   ~~Strikethrough item~~
*   Item with `code`
*   Item with [link](https://example.com)
*   Item with *nested **formatting***</code></pre>

</td>
<td>

<pre><code>*   **Bold item**
*   *Italic item*
*   ~~Strikethrough item~~
*   Item with `code`
*   Item with [link](https://example.com)
*   Item with *nested **formatting***</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - list items with paragraphs</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

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

*   First item

    Paragraph within the first list item.

    Another paragraph within the first list item.
*   Second item

    Paragraph within the second list item.

</td>
<td>

*   First item

    Paragraph within the first list item.

    Another paragraph within the first list item.
*   Second item

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

<pre><code>*   First item

    Paragraph within the first list item.

    Another paragraph within the first list item.
*   Second item

    Paragraph within the second list item.</code></pre>

</td>
<td>

<pre><code>*   First item

    Paragraph within the first list item.

    Another paragraph within the first list item.
*   Second item

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

*   Completed task
*   Incomplete task
*   Another completed task
*   Another incomplete task

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

<pre><code>*   Completed task
*   Incomplete task
*   Another completed task
*   Another incomplete task</code></pre>

</td>
</tr>
</table>

</details>

