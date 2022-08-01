# Packages

Inlang is broken into smaller packages. We hope that those packages help you extend the ecosystem around Fluent.

## Developing / Contributing / Commands

All packages have more or less the same structure. If in doubt, please open the `package.json`
file from the package of interest and look up the `scripts` property.

Generally, running commands from dedicated packages requires the cwd to be the root directory `inlang`
and run call commands with the `--workspace` flag.

**Example**
Running the `dev` command in a package:  
`npm run dev --workspace <package-name>`  
-> `npm run dev --workspace @inlang/fluent-ast`
