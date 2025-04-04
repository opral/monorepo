# Diff Results for common-md-horizontal-rules

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

# Horizontal Rules

Paragraph before horizontal rule.

---

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

___

Paragraph between horizontal rules.

- - -

Paragraph between horizontal rules.

* * *

Paragraph between horizontal rules.

_ _ _

Paragraph after horizontal rule.

Text
---
Text right after horizontal rule (or is this an alternative heading?)

Text right before horizontal rule
---

---
Text right after horizontal rule without paragraph spacing

</td>
<td>

# Horizontal Rules

Paragraph before horizontal rule.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph after horizontal rule.

## Text

Text right after horizontal rule (or is this an alternative heading?)

## Text right before horizontal rule

---

Text right after horizontal rule without paragraph spacing

</td>
</tr>
<tr>
<td>

<pre><code># Horizontal Rules

Paragraph before horizontal rule.

---

Paragraph between horizontal rules.

***

Paragraph between horizontal rules.

___

Paragraph between horizontal rules.

- - -

Paragraph between horizontal rules.

* * *

Paragraph between horizontal rules.

_ _ _

Paragraph after horizontal rule.

Text
---
Text right after horizontal rule (or is this an alternative heading?)

Text right before horizontal rule
---

---
Text right after horizontal rule without paragraph spacing</code></pre>

</td>
<td>

<pre><code># Horizontal Rules

Paragraph before horizontal rule.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph between horizontal rules.

---

Paragraph after horizontal rule.

## Text

Text right after horizontal rule (or is this an alternative heading?)

## Text right before horizontal rule

---

Text right after horizontal rule without paragraph spacing</code></pre>

</td>
</tr>
</table>

</details>

