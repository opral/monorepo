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

<hr />

Text with <br /> line break.

<img src="https://example.com/image.jpg" alt="Example Image" />

## HTML with Attributes

<a href="https://example.com" title="Example Website" target="_blank" rel="noopener noreferrer">Link with attributes</a>

<div id="unique-id" class="custom-class" data-custom="value">
  Div with multiple attributes
</div>

## IFrames and Embeds

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## HTML with CSS

<p class="custom-text">This text might be styled if CSS is allowed.</p>
