# Diff Results for common-md-empty-paragraphs

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

# Empty paragraphs test<!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
\-->Line with contentAnother line with contentMultiple empty lines between contentLast line


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

<pre><code># Empty paragraphs test&lt;!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
\--&gt;Line with contentAnother line with contentMultiple empty lines between contentLast line
</code></pre>

</td>
</tr>
</table>

</details>

