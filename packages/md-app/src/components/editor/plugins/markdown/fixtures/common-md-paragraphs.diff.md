# Diff Results for common-md-paragraphs

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

# Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaces  
which creates a line break.

This paragraph ends with a backslash\
which also creates a line break.

This paragraph has a <br> HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here's a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn't affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

> Blockquote paragraph.
>
> Another paragraph in the same blockquote.

1. List item paragraph.
   
   Second paragraph in the same list item, indented with 3 spaces.

-  List item with a line break  
   continuing on the next line.

For HTML processing, paragraph with <span style="color: red;">HTML</span> inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference[^1].

[^1]: This is the footnote content.

</td>
<td>

# Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaces
which creates a line break.

This paragraph ends with a backslash
which also creates a line break.

This paragraph has a <br /> HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here's a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn't affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

> Blockquote paragraph.Another paragraph in the same blockquote.

1.  List item paragraph.

    Second paragraph in the same list item, indented with 3 spaces.

*   List item with a line break
    continuing on the next line.

For HTML processing, paragraph with <span style="color: red;">HTML</span> inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference.


</td>
</tr>
<tr>
<td>

<pre><code># Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaces  
which creates a line break.

This paragraph ends with a backslash\
which also creates a line break.

This paragraph has a &lt;br&gt; HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here&#039;s a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn&#039;t affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

&gt; Blockquote paragraph.
&gt;
&gt; Another paragraph in the same blockquote.

1. List item paragraph.
   
   Second paragraph in the same list item, indented with 3 spaces.

-  List item with a line break  
   continuing on the next line.

For HTML processing, paragraph with &lt;span style=&quot;color: red;&quot;&gt;HTML&lt;/span&gt; inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference[^1].

[^1]: This is the footnote content.</code></pre>

</td>
<td>

<pre><code># Paragraphs and Line Breaks

This is a paragraph with a single sentence.

This is a paragraph with
multiple lines but
no line breaks in the rendered output.

This paragraph ends with two spaces
which creates a line break.

This paragraph ends with a backslash
which also creates a line break.

This paragraph has a &lt;br /&gt; HTML tag
which creates a line break.

Paragraph with *emphasized* and **strong** text.

Paragraph with `inline code` and [link](https://example.com).

Paragraph with *nested **formatting*** and **nested *formatting***.

Here&#039;s a paragraph with a very long line that will need to wrap in most text editors and viewers. It just keeps going to demonstrate how lines can be automatically wrapped and how that shouldn&#039;t affect the rendered output. Markdown treats consecutive lines of text as a single paragraph.

&gt; Blockquote paragraph.Another paragraph in the same blockquote.

1.  List item paragraph.

    Second paragraph in the same list item, indented with 3 spaces.

*   List item with a line break
    continuing on the next line.

For HTML processing, paragraph with &lt;span style=&quot;color: red;&quot;&gt;HTML&lt;/span&gt; inside it.

Some markdown processors support paragraph attributes:

{: .class-name #para-id}
Paragraph with attributes (might not work in all processors).

A paragraph with a footnote reference.
</code></pre>

</td>
</tr>
</table>

</details>

