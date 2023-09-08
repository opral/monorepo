# Source code

Every folder in this directory is a dedicated module.

TODO: dependency flowchart.

## Developing / Contributing / Commands

All packages have more or less the same structure. If in doubt, please open the `package.json`
file from the package of interest and look up the `scripts` property.

Generally, running commands from dedicated packages requires the CWD to be the root directory `inlang`
and run call commands with the `-w` flag.

**Example**
Running the `dev` command in a package:  
`npm run dev -w <package-name>`  
-> `npm run dev -w @inlang/ast`

### Guidelines

#### Don't use a bundler for JS if not required

ESM arrived. Bundlers for modules that are consumed by other modules don't need a bundler. Recommended read [you may not need a bundler](https://cmdcolin.github.io/posts/2022-05-27-youmaynotneedabundler).
