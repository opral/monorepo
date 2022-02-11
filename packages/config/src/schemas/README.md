# Schemas

The schemas use https://json-schema.org/. Using JSON Schema brings auto-complete and lintings to most IDE's via the
`$schema` property which is a link to one of the JSON schemas in this directory.

## Versioning

The schema versions follow [semantic versioning](https://semver.org/) with the deviation of non-existent patches
i.e. only major and minor versions `v1.0` instead of `v1.0.0`. Reason being, the schema is fetched as url. Any
patch potentially improves the auto-complete, documentation and validation experience. Using dedicated
patch versions eliminates the improved experiences because developers would have to manually update the `inlang.config.json`
file to point towards the patched schema.

Other than that, a minor version (`1.1`) means a property has been added and a major version (`2.0`) means
a breaking change (a property has been renamed / removed).
