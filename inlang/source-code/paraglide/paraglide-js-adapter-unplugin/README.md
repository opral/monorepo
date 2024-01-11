
# Paraglide Adapter Unplugin

This package provides an Unplugin Wrapper around the paraglide-js compiler, making it 
easier to use with bundler such as Vite, Webpack, Rollup, and RsPack.

[Learn more about Paraglide](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js)

## Usage
It's unlikely that you want to use this package directly. Instead, you should use the version
specific to your bundler. 

- `@inlang/paraglide-js-adapter-vite`
- `@inlang/paraglide-js-adapter-webpack`
- `@inlang/paraglide-js-adapter-rollup`
- `@inlang/paraglide-js-adapter-esbuild`

If you want to use the experimental RsPack bundler, you can use this package directly.

```js
import { paraglide } from "@inlang/paraglide-js-adapter-unplugin";
paraglide.rspack // RsPack Plugin (experimental)
```
