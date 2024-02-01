---
"@inlang/paraglide-js-adapter-sveltekit": patch
---

The `href` attribute on `<link rel="alternate"` is now always a fully qualified URL, including the protocol, as the spec demands. 

If you are prerendering, you should set `kit.prerendering.origin` in `svelte.config.js` to make sure the correct URL gets prerendered.
