# Usage on the server

## Re-Loading Language-Dependent data

You can tell a load function to re-run on language changes by calling `depends("paraglide:lang")`.

```ts
// src/routes/+page.server.js
export async function load({ depends }) {
  // Paraglide-SvelteKit automatically calls `invalidate("paraglide:lang")` whenever the langauge changes
  // This tells SvelteKit to re-run this function whenever that happens
  depends("paraglide:lang") 
  return await myLanguageSpecificData();
}
```
