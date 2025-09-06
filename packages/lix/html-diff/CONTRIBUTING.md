# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

> [!INFO]  
> If you are developing on Windows, you need to use [WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux).

## Development

1. Clone the [monorepo](https://github.com/opral/monorepo)
2. run `pnpm i` in the root of the repo
3. run `pnpm --filter @lix-js/html-diff... build` to build the dependencies of the package you want to work on
4. run `pnpm --filter @lix-js/html-diff dev` to run the development server

> [!INFO]  
> You need to run the build for the dependencies of the package via the three dots `...` at least once. [Here](https://pnpm.io/filtering#--filter-package_name-1) is the pnpm documentation for filtering.

## Development & Visual Testing

This package includes a Vite-based visual test website to help develop and debug the `renderHtmlDiff` function.

**Running the Test Website:**

1.  Ensure monorepo dependencies are installed (`pnpm install` from root).
2.  Start the dev server:

    ```bash
    # From monorepo root
    pnpm --filter @lix-js/html-diff dev

    # Or from this package directory
    pnpm dev
    ```

## Testing

The visual test website allows you to:

- Test different HTML diff scenarios
- Debug the `renderHtmlDiff` function
- Verify styling and output
- Add new test cases

## Opening a PR

1. run `pnpm run ci` to run all tests and checks
2. run `npx changeset` to write a changelog and trigger a version bump. watch this loom video to see how to use changesets: https://www.loom.com/share/1c5467ae3a5243d79040fc3eb5aa12d6
3. Test using the visual test website
4. Submit a pull request with a clear description of your changes
