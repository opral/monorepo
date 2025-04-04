# Diff Results for formatted-table

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
| Column 1| Column 2| Column 3 |
| --- | --- | --- |
| Row 1| Data 1| Data 2 |
| Row 2| Data 3| Data 4 |
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
| Column 1| Column 2| Column 3 |
| --- | --- | --- |
| Row 1| Data 1| Data 2 |
| Row 2| Data 3| Data 4 |
test</code></pre>

</td>
</tr>
</table>

</details>

