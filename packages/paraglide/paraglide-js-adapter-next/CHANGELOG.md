# @inlang/paraglide-js-adapter-next

## 0.2.0

### Minor Changes

- 92e371833: feat: Support translated Pathnames

### Patch Changes

- dd7ec830e: fix: `middleware` no longer sets `Link` header on excluded pages
- 63afca4fc: Simplify API of the `<ParaglideJS>` component used in the pages router.
  You no longer need to pass the `runtime` and `router.locale` as props to the `<ParaglideJS>` component. Instead, you can just use the component without any props. It will automatically use the runtime and language tag from the context.

  This change was enabled by the last-minute plugin changes that made it valuale to use in the pages router.
