---
imports: 
---

# Scaling

## Bundle Size

The main concern we get about paraglide is that it ships messages that are needed for a given page in _all languages_.

We are working hard on getting per-language splitting to work, but in the meantime I can put your mind at ease. Unless you use more than 500 messages **on a single page** Paraglide will be smaller.

### Scaling _Down_

Most pages don't use many messages. Many just use one or two. Thus, one of the most important metrics for an i18n library is how well it scales _down_. What's the bundle size impact with just one message?

Paraglide scales down very very well. The runtime can get as small as 300 bytes.

### Scaling _Up_

Paraglide currently sends messages that are _used_ on a given page in _all languages_. Thus the bundle scales up quicker than with other i18n libraries.

However, keep in mind that:

- Paraglide only loads the messages you _use_ on the current page.
- Paraglide starts out much smaller. The breakeven point comes after about 2500 messages variants (`messages*languages`) on a _single_ page. Of course this depends on your messages.

Given that most Projects have between two and four languages you can expect Paraglide's bundle to still be smaller than other i18n libraries up to about 500 messages _on a single page_.

This chart shows Paraglide's bundle size with a different number of languages compared to `i18next` loading a single language.

![Chart showing Paraglide starting out way smaller than i18next and then gradually overtaking it. With one language Paraglide never overtakes i18next. With two it overtakes it at 1250 messages. With five languages it overtakes it at about 400 messages](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/packages/paraglide/paraglide-js/docs/benchmark.png)

**Per-Language Splitting is a long-term goal for Paraglide**. Once Per-Language splitting works Paraglide's bundle will scale about 30% slower than other i18n libraries thanks to minified messageIDs. Keep track of progress in [this issue](https://github.com/opral/inlang-paraglide-js/issues/88).
