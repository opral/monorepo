---
"@inlang/paraglide-astro": minor
---

In `output: "server"` mode `AsyncLocalStorage` is now used to scope the language-state to the current request.

`AsyncLocalStorage` is an experimental node API, but it's already extensively used in frameworks like NextJS and is [on track to become a proper TC39 spec](https://github.com/tc39/proposal-async-context). All major serverless platforms support it. 

If you're using Cloudflare you will need to set `compatibility_flags = [ "nodejs_compat" ]` in `wrangler.toml.`