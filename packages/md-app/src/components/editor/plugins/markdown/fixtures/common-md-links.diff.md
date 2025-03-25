# Diff Results for common-md-links

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

# Links

[Basic link](https://example.com)

[Link with title](https://example.com "Example Website")

[Link with formatting **bold**](https://example.com)

[Link with formatting *italic*](https://example.com)

[Link with formatting `code`](https://example.com)

<https://example.com> (Automatic link)

<email@example.com> (Email link)

[Reference link][ref]

[Another reference link][ref]

[Reference link with different text][different-ref]

[Shorthand reference]

Paragraph with a [link](https://example.com) in the middle.

Paragraph with *[formatted link](https://example.com)* in italics.

Paragraph with **[formatted link](https://example.com)** in bold.

[ref]: https://example.com "Reference Example"
[different-ref]: https://example.com/different "Different Reference"
[shorthand reference]: https://example.com

</td>
<td>

# Links

[Basic link](https://example.com)

<br>[Link with title](https://example.com "Example Website")<br>

<br>[Link with formatting **bold**](https://example.com)<br>

<br>[Link with formatting *italic*](https://example.com)<br>

<br>[Link with formatting `code`](https://example.com)<br>

[https://example.com](https://example.com) (Automatic link)

[email@example.com](mailto:email@example.com) (Email link)

[Reference link][ref]

[Another reference link][ref]

[Reference link with different text][different-ref]

[Shorthand reference]

Paragraph with a [link](https://example.com) in the middle.

Paragraph with <br>*[formatted link](https://example.com)*<br> in italics.

Paragraph with <br>**[formatted link](https://example.com)**<br> in bold.

[ref]: https://example.com "Reference Example"

[different-ref]: https://example.com/different "Different Reference"

[shorthand reference]: https://example.com

</td>
</tr>
<tr>
<td>

<pre><code># Links

[Basic link](https://example.com)

[Link with title](https://example.com &quot;Example Website&quot;)

[Link with formatting **bold**](https://example.com)

[Link with formatting *italic*](https://example.com)

[Link with formatting `code`](https://example.com)

&lt;https://example.com&gt; (Automatic link)

&lt;email@example.com&gt; (Email link)

[Reference link][ref]

[Another reference link][ref]

[Reference link with different text][different-ref]

[Shorthand reference]

Paragraph with a [link](https://example.com) in the middle.

Paragraph with *[formatted link](https://example.com)* in italics.

Paragraph with **[formatted link](https://example.com)** in bold.

[ref]: https://example.com &quot;Reference Example&quot;
[different-ref]: https://example.com/different &quot;Different Reference&quot;
[shorthand reference]: https://example.com</code></pre>

</td>
<td>

<pre><code># Links

[Basic link](https://example.com)

&lt;br&gt;[Link with title](https://example.com &quot;Example Website&quot;)&lt;br&gt;

&lt;br&gt;[Link with formatting **bold**](https://example.com)&lt;br&gt;

&lt;br&gt;[Link with formatting *italic*](https://example.com)&lt;br&gt;

&lt;br&gt;[Link with formatting `code`](https://example.com)&lt;br&gt;

[https://example.com](https://example.com) (Automatic link)

[email@example.com](mailto:email@example.com) (Email link)

[Reference link][ref]

[Another reference link][ref]

[Reference link with different text][different-ref]

[Shorthand reference]

Paragraph with a [link](https://example.com) in the middle.

Paragraph with &lt;br&gt;*[formatted link](https://example.com)*&lt;br&gt; in italics.

Paragraph with &lt;br&gt;**[formatted link](https://example.com)**&lt;br&gt; in bold.

[ref]: https://example.com &quot;Reference Example&quot;

[different-ref]: https://example.com/different &quot;Different Reference&quot;

[shorthand reference]: https://example.com</code></pre>

</td>
</tr>
</table>

</details>

