# Rules for LLMs

- Do not mock lix. Lix is a local SQLite database that does not need mocking. Test cases should always use the real lix. 

- Lix uses Kysely to expose the the SQL API in a typesafe way https://kysely-org.github.io/kysely-apidoc/. 

- The api reference for lix can be found in [./api-docs/README.md](./api-docs/README.md)

- tests for the lix sdk can be run with `npx vitest run ...` 

- validate the types AFTER the tests pass with `npx tsc --noEmit`

- always start with implementing test cases that reproduce bugs before implementing a fix to validate if the test captures the bug

- do not create getter functions. isntead query sql  directly via kysely. otherwise, we end up with a huge pile of wrapper functions  