# Diff Results for html-tags

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

# Markdown with inline html

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works _perfectly fine_

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works _perfectly fine_

# markdown with block html element

# hello

<h1> hello </h1>

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/91317568?s=64&v=4" alt="opral icon">
  <p align="center">
    <a href='https://twitter.com/opralHQ' target="_blank">𝕏 Twitter</a>
    ·
    <a href='https://discord.gg/gdMPPWy57R' target="_blank">💬 Discord</a>
  </p>
</p>

test

# inline html in list

- 📦 **Import/Export**: Import and export messages in different file formats.
- <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> **Change control**: Collaboration, change proposals, reviews, and automation.

# random

<details>
<summary>yo</summary>

- asdasdsad
- asdasdasdasd
- asdasdsad
</details>


</td>
<td>

# Markdown with inline html

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works *perfectly fine*

Inline html node <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> works *perfectly fine*

# markdown with block html element

# hello

<h1> hello </h1>

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/91317568?s=64&v=4" alt="opral icon">
  <p align="center">
    <a href='https://twitter.com/opralHQ' target="_blank">𝕏 Twitter</a>
    ·
    <a href='https://discord.gg/gdMPPWy57R' target="_blank">💬 Discord</a>
  </p>
</p>

test

# inline html in list

* 📦 **Import/Export**: Import and export messages in different file formats.

* <img src="https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg" width="20" height="12" alt="Lix Icon"/> **Change control**: Collaboration, change proposals, reviews, and automation.

# random

<details>
<summary>yo</summary>

* asdasdsad

* asdasdasdasd

* asdasdsad

</details>


</td>
</tr>
<tr>
<td>

<pre><code># Markdown with inline html

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works _perfectly fine_

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works _perfectly fine_

# markdown with block html element

# hello

&lt;h1&gt; hello &lt;/h1&gt;

&lt;p align=&quot;center&quot;&gt;
  &lt;img src=&quot;https://avatars.githubusercontent.com/u/91317568?s=64&amp;v=4&quot; alt=&quot;opral icon&quot;&gt;
  &lt;p align=&quot;center&quot;&gt;
    &lt;a href=&#039;https://twitter.com/opralHQ&#039; target=&quot;_blank&quot;&gt;𝕏 Twitter&lt;/a&gt;
    ·
    &lt;a href=&#039;https://discord.gg/gdMPPWy57R&#039; target=&quot;_blank&quot;&gt;💬 Discord&lt;/a&gt;
  &lt;/p&gt;
&lt;/p&gt;

test

# inline html in list

- 📦 **Import/Export**: Import and export messages in different file formats.
- &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; **Change control**: Collaboration, change proposals, reviews, and automation.

# random

&lt;details&gt;
&lt;summary&gt;yo&lt;/summary&gt;

- asdasdsad
- asdasdasdasd
- asdasdsad
&lt;/details&gt;
</code></pre>

</td>
<td>

<pre><code># Markdown with inline html

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works *perfectly fine*

Inline html node &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; works *perfectly fine*

# markdown with block html element

# hello

&lt;h1&gt; hello &lt;/h1&gt;

&lt;p align=&quot;center&quot;&gt;
  &lt;img src=&quot;https://avatars.githubusercontent.com/u/91317568?s=64&amp;v=4&quot; alt=&quot;opral icon&quot;&gt;
  &lt;p align=&quot;center&quot;&gt;
    &lt;a href=&#039;https://twitter.com/opralHQ&#039; target=&quot;_blank&quot;&gt;𝕏 Twitter&lt;/a&gt;
    ·
    &lt;a href=&#039;https://discord.gg/gdMPPWy57R&#039; target=&quot;_blank&quot;&gt;💬 Discord&lt;/a&gt;
  &lt;/p&gt;
&lt;/p&gt;

test

# inline html in list

* 📦 **Import/Export**: Import and export messages in different file formats.

* &lt;img src=&quot;https://raw.githubusercontent.com/opral/monorepo/refs/heads/main/lix/assets/lix-icon.svg&quot; width=&quot;20&quot; height=&quot;12&quot; alt=&quot;Lix Icon&quot;/&gt; **Change control**: Collaboration, change proposals, reviews, and automation.

# random

&lt;details&gt;
&lt;summary&gt;yo&lt;/summary&gt;

* asdasdsad

* asdasdasdasd

* asdasdsad

&lt;/details&gt;
</code></pre>

</td>
</tr>
</table>

</details>

