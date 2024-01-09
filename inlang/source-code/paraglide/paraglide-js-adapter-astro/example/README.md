# Astro + Paraglide Example
This is an example project of how to use Paraglide with Astro. It properly switches between languages, demonstrates the fine-grained message splitting, and handles SEO properly.

- `package.json` - the `scripts` section shows how to use Paraglide with Astro
- `src/middleware` - Set's the language based on the URL
- `src/layouts/HTML.astro` - Shows how to set the `lang` attribute on the `<html>` tag
- `src/components/BaseHead.astro` - Shows how to set the `rel="alternate"` links for SEO
- `src/components/Counter.astro` - Shows how to use Paraglide on an Island

We encourage you to run the `build` command and inspect the output. You will notice that only the messages used on the client are shipped in the JS bundle. This is despite no manual message-splitting having been done. This is because Paraglide generates **tree-shakeable** code for your messages. That's the power of Paraglide!

This example also has `@inlang/paraglide-js-adapter-vite` set up, which automatically re-runs the compile on message changes. This is not required, but it makes development much easier. You can see how it's set up in `astro.config.mjs`.