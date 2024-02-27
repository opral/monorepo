---
"@inlang/paraglide-js-adapter-next": patch
---

Simplify API of the `<ParaglideJS>` component used in the pages router.
You no longer need to pass the `runtime` and `router.locale` as props to the `<ParaglideJS>` component. Instead, you can just use the component without any props. It will automatically use the runtime and language tag from the context.

This change was enabled by the last-minute plugin changes that made it valuale to use in the pages router. 
