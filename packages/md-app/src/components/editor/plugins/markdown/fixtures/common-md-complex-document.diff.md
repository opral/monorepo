# Diff Results for common-md-complex-document

## Test Summary

- 🟢 Perfect roundtrip (input = output): 4/25 (16%)
- 🟡 Acceptable transformation (output ≠ input, output = expected): 6/25 (24%)
- 🔴 Failing test (output ≠ input, output ≠ expected): 15/25 (60%)

**Overall Status**: ❌ 15 failing tests

---

<details >
<summary><span style="color:green; font-weight:bold;">tc - introduction</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This document demonstrates a wide variety of Markdown syntax elements and how they interact with each other. It's designed to test the roundtrip conversion capabilities of Markdown processors.

</td>
</tr>
<tr>
<td>

<pre><code>This document demonstrates a wide variety of Markdown syntax elements and how they interact with each other. It&#039;s designed to test the roundtrip conversion capabilities of Markdown processors.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - text formatting - italic</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates *italic text* inline also wiht _underscore_

</td>
<td>

This paragraph demonstrates _italic text_ inline also wiht _underscore_

</td>
<td>

This paragraph demonstrates _italic text_ inline also wiht _underscore_

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates *italic text* inline also wiht _underscore_</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates _italic text_ inline also wiht _underscore_</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates _italic text_ inline also wiht _underscore_</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - text formatting - bold/emphasis</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates __bold/emphasis text__ inline

</td>
<td>

This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline

</td>
<td>

This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates __bold/emphasis text__ inline</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates **bold/emphasis text** inline

This paragraph demonstrates **bold/emphasis text** inline</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - text formatting - bold AND italic with asterix *</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

This paragraph demonstrates ***italic AND bold text*** inline

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates ***italic AND bold text*** inline</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - text formatting - bold AND italic with underscore _</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph demonstrates ___italic AND bold text___ inline

</td>
<td>

This paragraph demonstrates ***italic AND bold text*** inline

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph demonstrates ___italic AND bold text___ inline</code></pre>

</td>
<td>

<pre><code>This paragraph demonstrates ***italic AND bold text*** inline</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - text formatting - strikethrough and inline code</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

Other formatting options include ~~strikethrough~~ and `inline code`.

</td>
</tr>
<tr>
<td>

<pre><code>Other formatting options include ~~strikethrough~~ and `inline code`.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - paragraphs and line breaks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Paragraphs are separated by blank lines.

This paragraph has a line break  
created with two trailing spaces.

This one has a line break\
created with a backslash.

This one has a line break<br>created with a break tag.

This one has a line break<br>
created with a break tag.

And another one to check if it worked

</td>
<td>

Paragraphs are separated by blank lines.

This paragraph has a line break<br>created with two trailing spaces.

This one has a line break<br>created with a backslash.

This one has a line break<br>created with a break tag.

And another one to check if it worked

</td>
<td>

Paragraphs are separated by blank lines.

This paragraph has a line breakcreated with two trailing spaces.

This one has a line breakcreated with a backslash.

This one has a line break<br>created with a break tag.

This one has a line break<br><br>created with a break tag.

And another one to check if it worked

</td>
</tr>
<tr>
<td>

<pre><code>Paragraphs are separated by blank lines.

This paragraph has a line break  
created with two trailing spaces.

This one has a line break\
created with a backslash.

This one has a line break&lt;br&gt;created with a break tag.

This one has a line break&lt;br&gt;
created with a break tag.

And another one to check if it worked</code></pre>

</td>
<td>

<pre><code>Paragraphs are separated by blank lines.

This paragraph has a line break&lt;br&gt;created with two trailing spaces.

This one has a line break&lt;br&gt;created with a backslash.

This one has a line break&lt;br&gt;created with a break tag.

And another one to check if it worked</code></pre>

</td>
<td>

<pre><code>Paragraphs are separated by blank lines.

This paragraph has a line breakcreated with two trailing spaces.

This one has a line breakcreated with a backslash.

This one has a line break&lt;br&gt;created with a break tag.

This one has a line break&lt;br&gt;&lt;br&gt;created with a break tag.

And another one to check if it worked</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - headings</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

<!-- reason for differing expectation:
we currently expect a line break after each paragraph -->

# Level 1 Heading
## Level 2 Heading
### Level 3 Heading
#### Level 4 Heading
##### Level 5 Heading
###### Level 6 Heading

Alternative Level 1 Heading
===========================

Alternative Level 2 Heading
---------------------------

</td>
<td>

<!-- reason for differing expectation:
we currently expect a line break after each paragraph -->


# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading

</td>
<td>

<!-- reason for differing expectation:
we currently expect a line break after each paragraph -->


# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading

</td>
</tr>
<tr>
<td>

<pre><code>&lt;!-- reason for differing expectation:
we currently expect a line break after each paragraph --&gt;

# Level 1 Heading
## Level 2 Heading
### Level 3 Heading
#### Level 4 Heading
##### Level 5 Heading
###### Level 6 Heading

Alternative Level 1 Heading
===========================

Alternative Level 2 Heading
---------------------------</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
we currently expect a line break after each paragraph --&gt;


# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
we currently expect a line break after each paragraph --&gt;


# Level 1 Heading

## Level 2 Heading

### Level 3 Heading

#### Level 4 Heading

##### Level 5 Heading

###### Level 6 Heading

# Alternative Level 1 Heading

## Alternative Level 2 Heading</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - links</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

[Basic link](https://example.com)

[Link with title](https://example.com "Example Website")

<https://example.com> (Automatic link)

<email@example.com> (Email link)

[Reference link][ref]

[ref]: https://example.com "Reference Example"

</td>
<td>

[Basic link](https://example.com)

[Link with title](https://example.com)

[https://example.com](https://example.com) (Automatic link)

[email@example.com](mailto:email@example.com) (Email link)

</td>
</tr>
<tr>
<td>

<pre><code>[Basic link](https://example.com)

[Link with title](https://example.com &quot;Example Website&quot;)

&lt;https://example.com&gt; (Automatic link)

&lt;email@example.com&gt; (Email link)

[Reference link][ref]

[ref]: https://example.com &quot;Reference Example&quot;</code></pre>

</td>
<td>

<pre><code>[Basic link](https://example.com)

[Link with title](https://example.com)

[https://example.com](https://example.com) (Automatic link)

[email@example.com](mailto:email@example.com) (Email link)</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - images</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

![Image example](https://example.com/image.jpg "Sample Image")

![Reference image][img-ref]

[img-ref]: https://example.com/ref-image.jpg "Reference Image"

[![Image with link](https://example.com/image.jpg "Click me")](https://example.com)

</td>
<td>

![Image example](https://example.com/image.jpg)

[<br>![Image with link](https://example.com/image.jpg)<br>](https://example.com)

</td>
</tr>
<tr>
<td>

<pre><code>![Image example](https://example.com/image.jpg &quot;Sample Image&quot;)

![Reference image][img-ref]

[img-ref]: https://example.com/ref-image.jpg &quot;Reference Image&quot;

[![Image with link](https://example.com/image.jpg &quot;Click me&quot;)](https://example.com)</code></pre>

</td>
<td>

<pre><code>![Image example](https://example.com/image.jpg)

[&lt;br&gt;![Image with link](https://example.com/image.jpg)&lt;br&gt;](https://example.com)</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - unordered lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item
- Item 3

</td>
<td>

<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->

### Unordered Lists
- Item 1
- Item 2
   - Nested item 2.1
   - Nested item 2.2
      - Deeply nested item
- Item 3

</td>
<td>

<!-- reason for differing expectation:
the identation may differ 1 meaning is the same -->


### Unordered Lists
- Item 1
- Item 2
   - Nested item 2.1
   - Nested item 2.2
      - Deeply nested item
- Item 3

</td>
</tr>
<tr>
<td>

<pre><code>&lt;!-- reason for differing expectation:
the identation may differ 1 meaning is the same --&gt;

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item
- Item 3</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
the identation may differ 1 meaning is the same --&gt;

### Unordered Lists
- Item 1
- Item 2
   - Nested item 2.1
   - Nested item 2.2
      - Deeply nested item
- Item 3</code></pre>

</td>
<td>

<pre><code>&lt;!-- reason for differing expectation:
the identation may differ 1 meaning is the same --&gt;


### Unordered Lists
- Item 1
- Item 2
   - Nested item 2.1
   - Nested item 2.2
      - Deeply nested item
- Item 3</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - ordered lists</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

### Ordered Lists

1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item

</td>
<td>

### Ordered Lists
1. First item
2. Second item
    1. Nested first
    2. Nested second
3. Third item

</td>
<td>

### Ordered Lists
1. First item
2. Second item
    1. Nested first
    2. Nested second
3. Third item

</td>
</tr>
<tr>
<td>

<pre><code>### Ordered Lists

1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item</code></pre>

</td>
<td>

<pre><code>### Ordered Lists
1. First item
2. Second item
    1. Nested first
    2. Nested second
3. Third item</code></pre>

</td>
<td>

<pre><code>### Ordered Lists
1. First item
2. Second item
    1. Nested first
    2. Nested second
3. Third item</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - mixed lists</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

### Mixed Lists

1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
     1. Ordered sub-sub-item
2. Second ordered item

</td>
<td>

### Mixed Lists
1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
       1. Ordered sub-sub-item
2. Second ordered item

</td>
<td>

### Mixed Lists
1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
       1. Ordered sub-sub-item
2. Second ordered item

</td>
</tr>
<tr>
<td>

<pre><code>### Mixed Lists

1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
     1. Ordered sub-sub-item
2. Second ordered item</code></pre>

</td>
<td>

<pre><code>### Mixed Lists
1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
       1. Ordered sub-sub-item
2. Second ordered item</code></pre>

</td>
<td>

<pre><code>### Mixed Lists
1. First ordered item
   - Unordered sub-item
   - Another unordered sub-item
       1. Ordered sub-sub-item
2. Second ordered item</code></pre>

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

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

</td>
<td>

### Task Lists
- Completed task
- Incomplete task
- Another completed task

</td>
</tr>
<tr>
<td>

<pre><code>### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task</code></pre>

</td>
<td>

<pre><code>### Task Lists
- Completed task
- Incomplete task
- Another completed task</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - blockquotes</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> Simple blockquote

> Blockquote with **formatting** and a [link](https://example.com).
>
> Multiple paragraphs in a blockquote.
>
> > Nested blockquote.

</td>
<td>

> Simple blockquote

> Blockquote with **formatting** and a link.Multiple paragraphs in a blockquote.Nested blockquote.

</td>
</tr>
<tr>
<td>

<pre><code>&gt; Simple blockquote

&gt; Blockquote with **formatting** and a [link](https://example.com).
&gt;
&gt; Multiple paragraphs in a blockquote.
&gt;
&gt; &gt; Nested blockquote.</code></pre>

</td>
<td>

<pre><code>&gt; Simple blockquote

&gt; Blockquote with **formatting** and a link.Multiple paragraphs in a blockquote.Nested blockquote.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - code blocks</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

Indented code block:

    function example() {
      return "Hello, world!";
    }

Fenced code block without language:

```
function example() {
  return "Hello, world!";
}
```

Fenced code block with language:

```javascript
function example() {
  return "Hello, world!";
}
```

</td>
<td>

Indented code block:

```
function example() {
  return "Hello, world!";
}
```

Fenced code block without language:

```
function example() {
  return "Hello, world!";
}
```

Fenced code block with language:

```javascript
function example() {
  return "Hello, world!";
}
```

</td>
</tr>
<tr>
<td>

<pre><code>Indented code block:

    function example() {
      return &quot;Hello, world!&quot;;
    }

Fenced code block without language:

```
function example() {
  return &quot;Hello, world!&quot;;
}
```

Fenced code block with language:

```javascript
function example() {
  return &quot;Hello, world!&quot;;
}
```</code></pre>

</td>
<td>

<pre><code>Indented code block:

```
function example() {
  return &quot;Hello, world!&quot;;
}
```

Fenced code block without language:

```
function example() {
  return &quot;Hello, world!&quot;;
}
```

Fenced code block with language:

```javascript
function example() {
  return &quot;Hello, world!&quot;;
}
```</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - tables</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) | ![Image](https://example.com/image.jpg) | > Quote |

</td>
<td>

| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Left| Center| Right |
| Cell| Cell| Cell || Formatted| Table| Header |
| --- | --- | --- |
| _Italic_| **Bold**| `Code` |
| [Link](https://example.com)| 
![Image](https://example.com/image.jpg)
| > Quote |

</td>
</tr>
<tr>
<td>

<pre><code>| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) | ![Image](https://example.com/image.jpg) | &gt; Quote |</code></pre>

</td>
<td>

<pre><code>| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Left| Center| Right |
| Cell| Cell| Cell || Formatted| Table| Header |
| --- | --- | --- |
| _Italic_| **Bold**| `Code` |
| [Link](https://example.com)| 
![Image](https://example.com/image.jpg)
| &gt; Quote |</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:#cc7700; font-weight:bold;">tc - horizontal rules</span> 🟡 <span title="Input = Output?">⚠️</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 33%">Original Input</th>
<th style="width: 33%">Expected Output</th>
<th style="width: 33%">Actual Output</th>
</tr>
<tr>
<td>

Above horizontal rule.

---

Between horizontal rules.

***

Between horizontal rules.

___

Below horizontal rule.

</td>
<td>

Above horizontal rule.

---

Between horizontal rules.

---

Between horizontal rules.

---

Below horizontal rule.

</td>
<td>

Above horizontal rule.

---

Between horizontal rules.

---

Between horizontal rules.

---

Below horizontal rule.

</td>
</tr>
<tr>
<td>

<pre><code>Above horizontal rule.

---

Between horizontal rules.

***

Between horizontal rules.

___

Below horizontal rule.</code></pre>

</td>
<td>

<pre><code>Above horizontal rule.

---

Between horizontal rules.

---

Between horizontal rules.

---

Below horizontal rule.</code></pre>

</td>
<td>

<pre><code>Above horizontal rule.

---

Between horizontal rules.

---

Between horizontal rules.

---

Below horizontal rule.</code></pre>

</td>
</tr>
</table>

</details>

<details >
<summary><span style="color:green; font-weight:bold;">tc - html</span> 🟢 <span title="Input = Output?">✅</span> <span title="Visual match?">✅</span></summary>

<table>
<tr>
<th style="width: 100%">Input / Output (identical)</th>
</tr>
<tr>
<td>

<div style="color: blue;">
  Some HTML content 
  <span>with nested elements</span>
</div>

</td>
</tr>
<tr>
<td>

<pre><code>&lt;div style=&quot;color: blue;&quot;&gt;
  Some HTML content 
  &lt;span&gt;with nested elements&lt;/span&gt;
&lt;/div&gt;</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - escaping characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

\*This is not italic\*

\`This is not code\`

\# This is not a heading

</td>
<td>

*This is not italic*

`This is not code`

# This is not a heading

</td>
</tr>
<tr>
<td>

<pre><code>\*This is not italic\*

\`This is not code\`

\# This is not a heading</code></pre>

</td>
<td>

<pre><code>*This is not italic*

`This is not code`

# This is not a heading</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - combined elements</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

> # Heading in a blockquote
>
> - List in a blockquote
>   1. Ordered in unordered
>   2. Another item
>
> ```javascript
> // Code in a blockquote
> console.log("Hello");
> ```

1. **Bold list item** with *italic text*
   - Nested list with `code` and [link](https://example.com)
     ```
     Code block in a list
     ```

</td>
<td>

> Heading in a blockquoteList in a blockquoteOrdered in unorderedAnother item
1. **Bold list item** with _italic text_
   - Nested list with `code` and [link](https://example.com)

```
Code block in a list
```

</td>
</tr>
<tr>
<td>

<pre><code>&gt; # Heading in a blockquote
&gt;
&gt; - List in a blockquote
&gt;   1. Ordered in unordered
&gt;   2. Another item
&gt;
&gt; ```javascript
&gt; // Code in a blockquote
&gt; console.log(&quot;Hello&quot;);
&gt; ```

1. **Bold list item** with *italic text*
   - Nested list with `code` and [link](https://example.com)
     ```
     Code block in a list
     ```</code></pre>

</td>
<td>

<pre><code>&gt; Heading in a blockquoteList in a blockquoteOrdered in unorderedAnother item
1. **Bold list item** with _italic text_
   - Nested list with `code` and [link](https://example.com)

```
Code block in a list
```</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - special characters</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

HTML entities: &amp; &lt; &gt; &quot; &apos;

Literal characters: & < > " '

</td>
<td>

HTML entities: & < > " '

Literal characters: & < > " '

</td>
</tr>
<tr>
<td>

<pre><code>HTML entities: &amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;apos;

Literal characters: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
<td>

<pre><code>HTML entities: &amp; &lt; &gt; &quot; &#039;

Literal characters: &amp; &lt; &gt; &quot; &#039;</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - footnotes</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

Text with a footnote.[^1]

Another paragraph with a different footnote.[^2]

[^1]: This is the first footnote.
[^2]: This is the second footnote with multiple lines.
    Indented to be part of the footnote.

</td>
<td>

Text with a footnote.

Another paragraph with a different footnote.

</td>
</tr>
<tr>
<td>

<pre><code>Text with a footnote.[^1]

Another paragraph with a different footnote.[^2]

[^1]: This is the first footnote.
[^2]: This is the second footnote with multiple lines.
    Indented to be part of the footnote.</code></pre>

</td>
<td>

<pre><code>Text with a footnote.

Another paragraph with a different footnote.</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - definition lists</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

</td>
<td>

Term 1<br>: Definition 1

Term 2<br>: Definition 2a<br>: Definition 2b

</td>
</tr>
<tr>
<td>

<pre><code>Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b</code></pre>

</td>
<td>

<pre><code>Term 1&lt;br&gt;: Definition 1

Term 2&lt;br&gt;: Definition 2a&lt;br&gt;: Definition 2b</code></pre>

</td>
</tr>
</table>

</details>

<details open>
<summary><span style="color:red; font-weight:bold;">tc - line breaks and empty paragraphs</span> 🔴 <span title="Input = Output?">❌</span> <span title="Visual match?">❌</span></summary>

<table>
<tr>
<th style="width: 50%">Input</th>
<th style="width: 50%">Actual Output</th>
</tr>
<tr>
<td>

This paragraph is followed by empty paragraphs.


This paragraph has multiple line breaks between it and the next paragraph.



This is the final paragraph.

</td>
<td>

This paragraph is followed by empty paragraphs.

This paragraph has multiple line breaks between it and the next paragraph.

This is the final paragraph.

</td>
</tr>
<tr>
<td>

<pre><code>This paragraph is followed by empty paragraphs.


This paragraph has multiple line breaks between it and the next paragraph.



This is the final paragraph.</code></pre>

</td>
<td>

<pre><code>This paragraph is followed by empty paragraphs.

This paragraph has multiple line breaks between it and the next paragraph.

This is the final paragraph.</code></pre>

</td>
</tr>
</table>

</details>

