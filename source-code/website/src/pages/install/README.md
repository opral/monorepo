Source code for the install app.

### Why is the install app in the website?

It lives under `@inlang/website` to be reachable via `https://inlang.com/install`.

## How to use the install app
The install app is usable in the browser and is flexible to handle different kinds of queries.

### Valid links

This is how a valid link looks like:
`https://inlang.com/install?repo=host/owner/repo&module="path/to/module.js","path/to/module2.js"`
(The module has to be present in the marketplace registry)

Alternatively, you can create a link for installing the module with letting the user choose the repo:
`https://inlang.com/install?module="path/to/module.js","path/to/module2.js"`
(The link hereby will automatically adjusted to the link above)
