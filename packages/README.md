# Packages

Inlang consists of multiple packages.

Those packages can be imported by apps as required.

## Developing / Contributing / Commands

All packages have more or less the same structure. If in doubt, please open the `package.json`
file from the package of interest and look up the `scripts` property.

Generally, running commands from dedicated packages requires the CWD to be the root directory `inlang`
and run call commands with the `--workspace` flag.

**Example**
Running the `dev` command in a package:  
`npm run dev --workspace <package-name>`  
-> `npm run dev --workspace @inlang/fluent-ast`

## Architecture

Packages do not use a bundler if they don't have to. Bundlers add complexity and are often not required. Recommended read [you may not need a bundler](https://cmdcolin.github.io/posts/2022-05-27-youmaynotneedabundler).
