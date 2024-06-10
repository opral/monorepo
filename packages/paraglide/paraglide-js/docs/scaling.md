# Scaling

## Bundle Size

The #1 concern we get about paraglide is that it ships messages that are needed for a given page in _all languages_.

We are working hard on getting per-language splitting to work, but in the meantime I can put your mind at ease.

Unless you use more than 500 messages **on a single page** Paraglide will be smaller.

We ran some benchmarks against i18next and came to the following conclusions:

- Paraglide scales to zero, meaning that few messages result in little code
- Paraglide's bundle size increases faster than i18next's, but it usually only catches up after 1500-2500 message variants. (message variant = num messages * num languages). This limit is _per page_, so it rarely get's hit. (Most pages use fewer than 100 messages)
- Once we get per-language splitting working Paraglide will permanently be 30% smaller than any other i18n library, regardless of how many messages you use. The lead will be greater with few messages.

### Scaling _Down_

Most pages don't use many messages, many just use one or two. Thus, one of the most important metrics for an i18n library is how well it scales _down_. What's the bundle size impact with just one message?

Paraglide scales down very well. The runtime can get as small as 300 bytes.

### Scaling _Up_

Paraglide currently sends messages that are _used_ on a given page in _all languages_. Thus it scales up quicker than other i18n libraries. 

However, there is more to consider. 
- Because 


In practice, as long as you are using fewer than 500 messages on a single page Paraglide will likely be smaller than other i18n libraries. 

That doesn't mean we don't care about per-language splitting. **Per-Language Splitting is a long-term goal for Paraglide**.

Once Per-Language splitting works paraglide will scale about 30% slower than other i18n libraries thanks to minified messageIDs. That's something to look forward to! 