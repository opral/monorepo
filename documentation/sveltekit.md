# SvelteKit Guide

## Current Limitations

SvelteKit does not have internationlized routing yet. A pending [pull request](https://github.com/sveltejs/kit/pull/1810)
appears to be merged soon.  
The demo uses a workaround by placing all routes in a [lang] directory. 

### Requirements

1. Installed inlang via npm or yarn.
2. Created a project at [inlang.dev](https://app.inlang.dev)
  
### 1. Load Translations

In your `__layout.svelte` file (or each route individually) add the
following to the [`load` function provided by SvelteKit](https://kit.svelte.dev/docs#loading):

> The script must have `context="module"`

```Svelte
<script context="module">
	import { setTranslations, loadTranslations } from 'inlang';

	export async function load({ page }) {
    // the demo uses page.params.lang 
		setTranslations(await loadTranslations('demo.sveltekit.inlang.dev', <the language>));
		return {};
	}
</script>

<script>
  // your regular JS for the component goes into another script
</script>

<!-- Your component goes here -->
```

2. Use `t()` for text that should be translated

```Svelte
<script>
  import { t } from "inlang"
</script>

<h1>{t(`About this app`)}</h1>

<!-- 
  If you translate nested HTML, prefix the t function with 
  @html
-->
<p>
  {@html t(`This is a <a href="https://kit.svelte.dev">SvelteKit</a> app. 
  You can make your own by typing the following into your command line 
  and following the prompts:`)}
</p>


```
