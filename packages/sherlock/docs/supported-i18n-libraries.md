# Supported i18n libraries

The support of i18n libraries depends on [plugins](/documentation/plugin).

Here you can find a list of supported i18n libraries and their corresponding plugins:

| **i18n library**                                       | **plugin**                                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [Paraglide JS](/m/gerre34r/library-inlang-paraglideJs) | [inlang message format](/m/reootnfj/plugin-inlang-messageFormat) + [m function matcher](/m/632iow21/plugin-inlang-mFunctionMatcher) |
| i18next                                                | [i18next](/m/3i8bor92/plugin-inlang-i18next)                                                                                        |
| next-intl                                              | [next-intl](/m/193hsyds/plugin-inlang-nextIntl)                                                                                     |
| sap-ui5                                                | [JSON](/m/ig84ng0o/plugin-inlang-json) + [sap-ui5 matcher](/m/wrh36dfb/plugin-inlang-sapUI5)                                        |
| vue-i18n                                               | [JSON](/m/ig84ng0o/plugin-inlang-json) + [t function matcher](/m/698iow33/plugin-inlang-tFunctionMatcher)                           |
| libraries with regular JSON files                      | [JSON](/m/ig84ng0o/plugin-inlang-json) + [t function matcher](/m/698iow33/plugin-inlang-tFunctionMatcher)                           |

Note: The plugins are not limited to the libraries mentioned above. If you have a library that is not listed here, you can still use the plugins mentioned above if the library uses the same format like the JSON format or the t function matcher.

## Is there no plugin for your library?

- [Create a new plugin](/documentation/plugin/guide) for your library.
- [Join our Discord](https://discord.gg/gdMPPWy57R) and let us know which library you would like to see supported.
