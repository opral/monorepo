---
"vs-code-extension": major
---

# Sherlock v2 🎉

🎸 Features:

- improved editing experience overall
- new variant editor to support variants
- support for Cursor (AI editor)
- fix bugs, improve performance and stability

## Uprading to Sherlock v2

**There is no action needed** to upgrade to Sherlock v2. The plugin is now compatible with the new version and if you linked the plugin with `@latest`as we advise in the documentation.

You should be able to use the plugin with Sherlock v2 without any issues. If there are any issues, please let us know via Discord/GitHub.

### Want to keep Sherlock v1 and the old plugin version?

If you still want to use Sherlock v1, please use the previous major version of the plugin. For Sherlock itself, [please pin the version to `1.x.x`](https://github.com/microsoft/vscode-docs/blob/vnext/release-notes/v1_91.md#extension-install-options) in the VS Code extension settings.

### Breaking changes

- Lint rules are now polyfilled (and therefore may work different), as we are currently reworking how lint rules are working with [Lix Validation Rules](https://lix.opral.com). If you experience different behavior with lint rules, please reach out to us.
- The `messageId` parameter in the `extractMessages` function has been renamed to `bundleId`. This change is due to the new API in Sherlock v2. If you are using the `extractMessages` function, please update the parameter name to `bundleId`.
