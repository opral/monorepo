### What is this?

Contains utils for the server side environment. `_` ensures that SvelteKit is not creating endpoints
for the `.ts` files contained in the directory.

### Why?

Server side utils e.g. database etc. must not be imported in the front-end. Seperating those from
the front-end seems reasonable.
