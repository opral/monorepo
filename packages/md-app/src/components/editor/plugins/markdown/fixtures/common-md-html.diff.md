# Diff Results for common-md-html

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

# HTML in Markdown

<!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer's
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
-->

## Inline HTML

This paragraph contains <em>inline HTML</em> elements.

This paragraph contains <strong>bold text</strong> using HTML.

This paragraph has a <a href="https://example.com">link</a> using HTML.

This paragraph has <span style="color: red;">styled text</span> using HTML.

This paragraph has a line break using HTML.<br>This is on a new line.

## Block HTML

<div style="background-color: #f0f0f0; padding: 10px;">
  <h3>HTML Block</h3>
  <p>This is a paragraph inside an HTML block.</p>
  <ul>
    <li>List item 1</li>
    <li>List item 2</li>
  </ul>
</div>

## HTML Tables

<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
    <tr>
      <td>Cell 3</td>
      <td>Cell 4</td>
    </tr>
  </tbody>
</table>

## HTML and Markdown Mixed

<div>
  
### Markdown Heading Inside HTML

- List item 1
- List item 2

</div>

## HTML Comments

<!-- This is an HTML comment that shouldn't be visible in the rendered output -->

Text before comment <!-- Inline comment --> text after comment.

## Void HTML Elements

<hr>

Text with <br> line break.

<img src="https://example.com/image.jpg" alt="Example Image">

## HTML with Attributes

<a href="https://example.com" title="Example Website" target="_blank" rel="noopener noreferrer">Link with attributes</a>

<div id="unique-id" class="custom-class" data-custom="value">
  Div with multiple attributes
</div>

## IFrames and Embeds

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## HTML Forms

<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name"><br>
  
  <label for="email">Email:</label>
  <input type="email" id="email" name="email"><br>
  
  <input type="submit" value="Submit">
</form>

## Scripts (might be stripped by some parsers)

<script>
  function sayHello() {
    alert('Hello, world!');
  }
</script>

<button onclick="sayHello()">Click me</button>

## HTML with CSS

<style>
  .custom-text {
    color: blue;
    font-weight: bold;
  }
</style>

<p class="custom-text">This text might be styled if CSS is allowed.</p>

</td>
<td>

# HTML in Markdown

<!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer's
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
-->

## Inline HTML

This paragraph contains <em>inline HTML</em> elements.

This paragraph contains <strong>bold text</strong> using HTML.

This paragraph has a <a href="https://example.com">link</a> using HTML.

This paragraph has <span style="color: red;">styled text</span> using HTML.

This paragraph has a line break using HTML.<br />This is on a new line.

## Block HTML

<div style="background-color: #f0f0f0; padding: 10px;">
  <h3>HTML Block</h3>
  <p>This is a paragraph inside an HTML block.</p>
  <ul>
    <li>List item 1</li>
    <li>List item 2</li>
  </ul>
</div>

## HTML Tables

<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
    <tr>
      <td>Cell 3</td>
      <td>Cell 4</td>
    </tr>
  </tbody>
</table>

## HTML and Markdown Mixed

<div>

### Markdown Heading Inside HTML

*   List item 1
*   List item 2

</div>

## HTML Comments

<!-- This is an HTML comment that shouldn't be visible in the rendered output -->

Text before comment <!-- Inline comment --> text after comment.

## Void HTML Elements

<hr>

Text with <br /> line break.

<img src="https://example.com/image.jpg" alt="Example Image">

## HTML with Attributes

<a href="https://example.com" title="Example Website" target="_blank" rel="noopener noreferrer">Link with attributes</a>

<div id="unique-id" class="custom-class" data-custom="value">
  Div with multiple attributes
</div>

## IFrames and Embeds

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## HTML Forms

<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name"><br />

<label for="email">Email:</label> <input type="email" id="email" name="email"><br />

  <input type="submit" value="Submit">
</form>

## Scripts (might be stripped by some parsers)

<script>
  function sayHello() {
    alert('Hello, world!');
  }
</script>

<button onclick="sayHello()">Click me</button>

## HTML with CSS

<style>
  .custom-text {
    color: blue;
    font-weight: bold;
  }
</style>

<p class="custom-text">This text might be styled if CSS is allowed.</p>


</td>
</tr>
<tr>
<td>

<pre><code># HTML in Markdown

&lt;!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer&#039;s
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
--&gt;

## Inline HTML

This paragraph contains &lt;em&gt;inline HTML&lt;/em&gt; elements.

This paragraph contains &lt;strong&gt;bold text&lt;/strong&gt; using HTML.

This paragraph has a &lt;a href=&quot;https://example.com&quot;&gt;link&lt;/a&gt; using HTML.

This paragraph has &lt;span style=&quot;color: red;&quot;&gt;styled text&lt;/span&gt; using HTML.

This paragraph has a line break using HTML.&lt;br&gt;This is on a new line.

## Block HTML

&lt;div style=&quot;background-color: #f0f0f0; padding: 10px;&quot;&gt;
  &lt;h3&gt;HTML Block&lt;/h3&gt;
  &lt;p&gt;This is a paragraph inside an HTML block.&lt;/p&gt;
  &lt;ul&gt;
    &lt;li&gt;List item 1&lt;/li&gt;
    &lt;li&gt;List item 2&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;

## HTML Tables

&lt;table&gt;
  &lt;thead&gt;
    &lt;tr&gt;
      &lt;th&gt;Column 1&lt;/th&gt;
      &lt;th&gt;Column 2&lt;/th&gt;
    &lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 1&lt;/td&gt;
      &lt;td&gt;Cell 2&lt;/td&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 3&lt;/td&gt;
      &lt;td&gt;Cell 4&lt;/td&gt;
    &lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;

## HTML and Markdown Mixed

&lt;div&gt;
  
### Markdown Heading Inside HTML

- List item 1
- List item 2

&lt;/div&gt;

## HTML Comments

&lt;!-- This is an HTML comment that shouldn&#039;t be visible in the rendered output --&gt;

Text before comment &lt;!-- Inline comment --&gt; text after comment.

## Void HTML Elements

&lt;hr&gt;

Text with &lt;br&gt; line break.

&lt;img src=&quot;https://example.com/image.jpg&quot; alt=&quot;Example Image&quot;&gt;

## HTML with Attributes

&lt;a href=&quot;https://example.com&quot; title=&quot;Example Website&quot; target=&quot;_blank&quot; rel=&quot;noopener noreferrer&quot;&gt;Link with attributes&lt;/a&gt;

&lt;div id=&quot;unique-id&quot; class=&quot;custom-class&quot; data-custom=&quot;value&quot;&gt;
  Div with multiple attributes
&lt;/div&gt;

## IFrames and Embeds

&lt;iframe width=&quot;560&quot; height=&quot;315&quot; src=&quot;https://www.youtube.com/embed/dQw4w9WgXcQ&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture&quot; allowfullscreen&gt;&lt;/iframe&gt;

## HTML Forms

&lt;form action=&quot;/submit&quot; method=&quot;post&quot;&gt;
  &lt;label for=&quot;name&quot;&gt;Name:&lt;/label&gt;
  &lt;input type=&quot;text&quot; id=&quot;name&quot; name=&quot;name&quot;&gt;&lt;br&gt;
  
  &lt;label for=&quot;email&quot;&gt;Email:&lt;/label&gt;
  &lt;input type=&quot;email&quot; id=&quot;email&quot; name=&quot;email&quot;&gt;&lt;br&gt;
  
  &lt;input type=&quot;submit&quot; value=&quot;Submit&quot;&gt;
&lt;/form&gt;

## Scripts (might be stripped by some parsers)

&lt;script&gt;
  function sayHello() {
    alert(&#039;Hello, world!&#039;);
  }
&lt;/script&gt;

&lt;button onclick=&quot;sayHello()&quot;&gt;Click me&lt;/button&gt;

## HTML with CSS

&lt;style&gt;
  .custom-text {
    color: blue;
    font-weight: bold;
  }
&lt;/style&gt;

&lt;p class=&quot;custom-text&quot;&gt;This text might be styled if CSS is allowed.&lt;/p&gt;</code></pre>

</td>
<td>

<pre><code># HTML in Markdown

&lt;!--
TEST REASONING:
HTML embedded in Markdown must be preserved exactly as written.
HTML tags, attributes, and indentation are all semantically significant and 
any changes could break functionality. The test verifies the serializer&#039;s
ability to maintain 100% fidelity with HTML content. Unlike other Markdown
elements, no normalization should occur with HTML.
--&gt;

## Inline HTML

This paragraph contains &lt;em&gt;inline HTML&lt;/em&gt; elements.

This paragraph contains &lt;strong&gt;bold text&lt;/strong&gt; using HTML.

This paragraph has a &lt;a href=&quot;https://example.com&quot;&gt;link&lt;/a&gt; using HTML.

This paragraph has &lt;span style=&quot;color: red;&quot;&gt;styled text&lt;/span&gt; using HTML.

This paragraph has a line break using HTML.&lt;br /&gt;This is on a new line.

## Block HTML

&lt;div style=&quot;background-color: #f0f0f0; padding: 10px;&quot;&gt;
  &lt;h3&gt;HTML Block&lt;/h3&gt;
  &lt;p&gt;This is a paragraph inside an HTML block.&lt;/p&gt;
  &lt;ul&gt;
    &lt;li&gt;List item 1&lt;/li&gt;
    &lt;li&gt;List item 2&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;

## HTML Tables

&lt;table&gt;
  &lt;thead&gt;
    &lt;tr&gt;
      &lt;th&gt;Column 1&lt;/th&gt;
      &lt;th&gt;Column 2&lt;/th&gt;
    &lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 1&lt;/td&gt;
      &lt;td&gt;Cell 2&lt;/td&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
      &lt;td&gt;Cell 3&lt;/td&gt;
      &lt;td&gt;Cell 4&lt;/td&gt;
    &lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;

## HTML and Markdown Mixed

&lt;div&gt;

### Markdown Heading Inside HTML

*   List item 1
*   List item 2

&lt;/div&gt;

## HTML Comments

&lt;!-- This is an HTML comment that shouldn&#039;t be visible in the rendered output --&gt;

Text before comment &lt;!-- Inline comment --&gt; text after comment.

## Void HTML Elements

&lt;hr&gt;

Text with &lt;br /&gt; line break.

&lt;img src=&quot;https://example.com/image.jpg&quot; alt=&quot;Example Image&quot;&gt;

## HTML with Attributes

&lt;a href=&quot;https://example.com&quot; title=&quot;Example Website&quot; target=&quot;_blank&quot; rel=&quot;noopener noreferrer&quot;&gt;Link with attributes&lt;/a&gt;

&lt;div id=&quot;unique-id&quot; class=&quot;custom-class&quot; data-custom=&quot;value&quot;&gt;
  Div with multiple attributes
&lt;/div&gt;

## IFrames and Embeds

&lt;iframe width=&quot;560&quot; height=&quot;315&quot; src=&quot;https://www.youtube.com/embed/dQw4w9WgXcQ&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture&quot; allowfullscreen&gt;&lt;/iframe&gt;

## HTML Forms

&lt;form action=&quot;/submit&quot; method=&quot;post&quot;&gt;
  &lt;label for=&quot;name&quot;&gt;Name:&lt;/label&gt;
  &lt;input type=&quot;text&quot; id=&quot;name&quot; name=&quot;name&quot;&gt;&lt;br /&gt;

&lt;label for=&quot;email&quot;&gt;Email:&lt;/label&gt; &lt;input type=&quot;email&quot; id=&quot;email&quot; name=&quot;email&quot;&gt;&lt;br /&gt;

  &lt;input type=&quot;submit&quot; value=&quot;Submit&quot;&gt;
&lt;/form&gt;

## Scripts (might be stripped by some parsers)

&lt;script&gt;
  function sayHello() {
    alert(&#039;Hello, world!&#039;);
  }
&lt;/script&gt;

&lt;button onclick=&quot;sayHello()&quot;&gt;Click me&lt;/button&gt;

## HTML with CSS

&lt;style&gt;
  .custom-text {
    color: blue;
    font-weight: bold;
  }
&lt;/style&gt;

&lt;p class=&quot;custom-text&quot;&gt;This text might be styled if CSS is allowed.&lt;/p&gt;
</code></pre>

</td>
</tr>
</table>

</details>

