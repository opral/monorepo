# Usage on the server

The code you write on the server will usually be the exact same you would write on the client, but there are a few small things to be aware of.

## Avoiding Cross-Talk

SvelteKit does two kinds of work on the server: _Loading_ and _Rendering_. 

- _Loading_ includes running your `load` functions, `actions` or server-hooks. 
- _Rendering_ is anything that happens in or is called from a `.svelte` file.

Loading is asynchronous & rendering is synchronous. 

During the asynchronous loading, there is danger of crosstalk. If you aren't careful it's possible for one request to override the language of another request. You can avoid this by explicitly specifying which language a message should be in.

```ts
import * as m from "$lib/paraglide/messages.js"

export async function load({ locals }) {
  const translatedText = m.some_message({ ...message_params }, { languageTag: locals.paraglide.lang })
  return { translatedText }
}
```

During rendering there is no danger of crosstalk. You can safely use messages and the `langaugeTag()` function. 

## Re-Loading Language-Dependent data

You can tell a load function to re-run on language changes by calling `depends("paraglide:lang")`.

```ts
export async function load({ depends }) {
  // Paraglide-SvelteKit automatically calls `invalidate("paraglide:lang")` whenever the langauge changes
  // This tells SvelteKit to re-run this function whenever that happens
  depends("paraglide:lang") 
  return await myLanguageSpecificData();
}
```
