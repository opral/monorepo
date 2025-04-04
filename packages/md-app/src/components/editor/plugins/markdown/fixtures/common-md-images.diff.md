# Diff Results for common-md-images

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

# Images

![Basic image](https://example.com/image.jpg)

![Image with alt text](https://example.com/image.jpg "Example Image")

![Image with *formatted* alt text](https://example.com/image.jpg)

[![Image with link](https://example.com/image.jpg)](https://example.com)

![Reference image][image-ref]

![Another reference image][image-ref]

![Reference image with different text][different-image-ref]

Paragraph with an ![inline image](https://example.com/image.jpg) in the middle.

Paragraph with *![formatted inline image](https://example.com/image.jpg)* in italics.

Paragraph with **![formatted inline image](https://example.com/image.jpg)** in bold.

![Image with empty source]()

![](https://example.com/image.jpg)

[image-ref]: https://example.com/ref-image.jpg "Reference Example Image"
[different-image-ref]: https://example.com/different-image.jpg "Different Reference Image"

</td>
<td>

# Images

![Basic image](https://example.com/image.jpg)

![Image with alt text](https://example.com/image.jpg)

![Image with formatted alt text](https://example.com/image.jpg)

[<br>![Image with link](https://example.com/image.jpg)<br>](https://example.com)

Paragraph with an 

![inline image](https://example.com/image.jpg)

 in the middle.

Paragraph with __ in italics.

Paragraph with **** in bold.

![Image with empty source]()

![](https://example.com/image.jpg)

</td>
</tr>
<tr>
<td>

<pre><code># Images

![Basic image](https://example.com/image.jpg)

![Image with alt text](https://example.com/image.jpg &quot;Example Image&quot;)

![Image with *formatted* alt text](https://example.com/image.jpg)

[![Image with link](https://example.com/image.jpg)](https://example.com)

![Reference image][image-ref]

![Another reference image][image-ref]

![Reference image with different text][different-image-ref]

Paragraph with an ![inline image](https://example.com/image.jpg) in the middle.

Paragraph with *![formatted inline image](https://example.com/image.jpg)* in italics.

Paragraph with **![formatted inline image](https://example.com/image.jpg)** in bold.

![Image with empty source]()

![](https://example.com/image.jpg)

[image-ref]: https://example.com/ref-image.jpg &quot;Reference Example Image&quot;
[different-image-ref]: https://example.com/different-image.jpg &quot;Different Reference Image&quot;</code></pre>

</td>
<td>

<pre><code># Images

![Basic image](https://example.com/image.jpg)

![Image with alt text](https://example.com/image.jpg)

![Image with formatted alt text](https://example.com/image.jpg)

[&lt;br&gt;![Image with link](https://example.com/image.jpg)&lt;br&gt;](https://example.com)

Paragraph with an 

![inline image](https://example.com/image.jpg)

 in the middle.

Paragraph with __ in italics.

Paragraph with **** in bold.

![Image with empty source]()

![](https://example.com/image.jpg)</code></pre>

</td>
</tr>
</table>

</details>

