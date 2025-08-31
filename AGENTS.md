# Opral Monorepo Claude Instructions

- Read the [./contributing.md](./contributing.md) for navigating the monorepo.
  
- The monorepo uses `pnpm`. Don't use `npm` or `yarn`.

- If you want to test a specific code file, it's easiest to cwd into the package directory and run `pnpm exec vitest run <filter>`.

### Write JSDoc comments

- Use JSDoc comments to document your code.
- Use the `@example` tag to provide an example of how to use the API.
- If you refactor or change an API, ensure to update the JSDoc comments accordingly.

The usual structure is:

```
/**
 * One liner on what the API does.
 *
 * Multi paragraph longer description of the API,
 * if needed.
 *
 * @example
 *
 */
```

### Lix SDK development 

If you develop in the @lix-js/sdk package, ensure that modifications are reflected in the docs. You can find the docs in the @lix-js/docs package. 

