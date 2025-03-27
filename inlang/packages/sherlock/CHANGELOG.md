# inlang-vs-code-extension

## 2.0.11

### Patch Changes

- Updated dependencies [083ff1f]
  - @inlang/sdk@2.4.5
  - @inlang/rpc@0.3.47
  - @inlang/editor-component@4.0.5
  - @inlang/settings-component@5.0.0

## 2.0.10

### Patch Changes

- @inlang/sdk@2.4.4
- @inlang/rpc@0.3.46
- @inlang/editor-component@4.0.4
- @inlang/settings-component@5.0.0

## 2.0.9

### Patch Changes

- Updated dependencies [d88401e]
  - @inlang/rpc@0.3.45

## 2.0.8

### Patch Changes

- @inlang/sdk@2.4.3
- @inlang/rpc@0.3.44
- @inlang/editor-component@4.0.3
- @inlang/settings-component@5.0.0

## 2.0.7

### Patch Changes

- @inlang/sdk@2.4.2
- @inlang/rpc@0.3.43
- @inlang/editor-component@4.0.2
- @inlang/settings-component@5.0.0

## 2.0.6

### Patch Changes

- Updated dependencies [4b4d07e]
- Updated dependencies [8b20480]
- Updated dependencies [f173871]
  - @inlang/rpc@0.3.42

## 2.0.5

### Patch Changes

- aeae571: fix: save the inlang project after message extraction

## 2.0.4

### Patch Changes

- e6bcc47: fix `fg` impl

## 2.0.3

### Patch Changes

- 5a991cd: fix sdk&sherlock on win
- Updated dependencies [5a991cd]
  - @inlang/sdk@2.4.1
  - @inlang/rpc@0.3.41
  - @inlang/editor-component@4.0.1
  - @inlang/settings-component@5.0.0

## 2.0.2

### Patch Changes

- Updated dependencies
  - @inlang/rpc@0.3.39

## 2.0.1

### Patch Changes

- 5dc768a: remove `transpileCjs`

## 2.0.0

### Major Changes

- 8a9a8c9: # Sherlock v2 🎉

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

### Patch Changes

- Updated dependencies [f01927c]
  - @inlang/settings-component@5.0.0
  - @inlang/editor-component@4.0.0
  - @inlang/sdk@2.4.0
  - @inlang/rpc@0.3.38

## 1.48.3

### Patch Changes

- Updated dependencies [59c8b11]
  - @inlang/recommend-ninja@0.1.1

## 1.48.2

### Patch Changes

- @inlang/rpc@0.3.36
- @inlang/settings-component@1.0.30

## 1.48.1

### Patch Changes

- 7ef2fba: improve recommendation behavior

## 1.48.0

### Minor Changes

- e37eabf: - renamed packages `@inlang/cross-sell-X` to `@inlang/recommend-X` be more descriptive
  - refactor recommendation view in Sherlock VS Code extension
  - introduce new `shouldRecommend` function to `@inlang/recommend-sherlock` & `@inlang/recommend-ninja`

### Patch Changes

- Updated dependencies [e37eabf]
- Updated dependencies [e8d74b9]
  - @inlang/recommend-sherlock@0.1.0
  - @inlang/recommend-ninja@0.1.0
  - @lix-js/fs@2.2.0
  - @inlang/sdk@0.36.3
  - @lix-js/client@2.2.1
  - @inlang/rpc@0.3.35
  - @inlang/settings-component@1.0.30
  - @inlang/telemetry@0.3.50

## 1.47.0

### Minor Changes

- 58c66d8: fix `missing enabledApiProposal` bug

## 1.46.1

### Patch Changes

- de0b0d3: fix crash associated with Inlang SDK caching
- Updated dependencies [2fc5feb]
  - @inlang/sdk@0.36.2
  - @inlang/rpc@0.3.34
  - @inlang/settings-component@1.0.29
  - @inlang/telemetry@0.3.49

## 1.46.0

### Minor Changes

- 07c572c: update deps

## 1.45.2

### Patch Changes

- Updated dependencies [1077e06]
  - @inlang/sdk@0.36.1
  - @inlang/rpc@0.3.33
  - @inlang/settings-component@1.0.28
  - @inlang/telemetry@0.3.48

## 1.45.1

### Patch Changes

- da3963a: adjust path in project tab
- Updated dependencies [8ec7b34]
- Updated dependencies [05f9282]
  - @inlang/sdk@0.36.0
  - @inlang/rpc@0.3.32
  - @inlang/settings-component@1.0.27
  - @inlang/telemetry@0.3.47

## 1.45.0

### Minor Changes

- 9e2125b: default human ids in sherlock

## 1.44.16

### Patch Changes

- fadd94d: project selection focus on name instead of paths

## 1.44.15

### Patch Changes

- Updated dependencies [8e9fc0f]
  - @inlang/sdk@0.35.9
  - @inlang/rpc@0.3.31
  - @inlang/settings-component@1.0.26
  - @inlang/telemetry@0.3.46

## 1.44.14

### Patch Changes

- f472213: remove migrateSettingsFromInlangToSherlock because its no longer needed

## 1.44.13

### Patch Changes

- Updated dependencies [da7c207]
  - @inlang/sdk@0.35.8
  - @inlang/rpc@0.3.30
  - @inlang/settings-component@1.0.25
  - @inlang/telemetry@0.3.45

## 1.44.12

### Patch Changes

- e318e7b: fix turning off inline previews also turns off hover for messages

## 1.44.11

### Patch Changes

- Updated dependencies [2a5645c]
  - @inlang/sdk@0.35.7
  - @inlang/rpc@0.3.29
  - @inlang/settings-component@1.0.24
  - @inlang/telemetry@0.3.44

## 1.44.10

### Patch Changes

- d88613e: update docs with supported libraries
- Updated dependencies [9d2aa1a]
  - @inlang/sdk@0.35.6
  - @inlang/rpc@0.3.28
  - @inlang/settings-component@1.0.23
  - @inlang/telemetry@0.3.43

## 1.44.9

### Patch Changes

- Updated dependencies [64e30ee]
  - @inlang/sdk@0.35.5
  - @inlang/rpc@0.3.27
  - @inlang/settings-component@1.0.22
  - @inlang/telemetry@0.3.42

## 1.44.8

### Patch Changes

- Updated dependencies [3b2e0a6]
  - @lix-js/client@2.2.0
  - @inlang/sdk@0.35.4
  - @inlang/rpc@0.3.26
  - @inlang/settings-component@1.0.21
  - @inlang/telemetry@0.3.41

## 1.44.7

### Patch Changes

- Updated dependencies [548bc9e]
  - @lix-js/client@2.1.0
  - @inlang/sdk@0.35.3
  - @inlang/rpc@0.3.25
  - @inlang/settings-component@1.0.20
  - @inlang/telemetry@0.3.40

## 1.44.6

### Patch Changes

- Updated dependencies [4a25124]
  - @lix-js/fs@2.1.0
  - @inlang/sdk@0.35.2
  - @lix-js/client@2.0.1
  - @inlang/rpc@0.3.24
  - @inlang/settings-component@1.0.19
  - @inlang/telemetry@0.3.39

## 1.44.5

### Patch Changes

- 522bd61: add check for number to m function matcher & update vs code settings component

## 1.44.4

### Patch Changes

- Updated dependencies [00ad046]
- Updated dependencies [00ad046]
  - @lix-js/fs@2.0.0
  - @lix-js/client@2.0.0
  - @inlang/sdk@0.35.1
  - @inlang/rpc@0.3.23
  - @inlang/settings-component@1.0.18
  - @inlang/telemetry@0.3.38

## 1.44.3

### Patch Changes

- Updated dependencies [ae47203]
  - @inlang/sdk@0.35.0
  - @inlang/rpc@0.3.22
  - @inlang/settings-component@1.0.17
  - @inlang/telemetry@0.3.37

## 1.44.2

### Patch Changes

- a27b7a4: This reintroduces reactivity to lint reports - see https://github.com/opral/monorepo/pull/2792 for more details
- Updated dependencies [d27a983]
- Updated dependencies [a27b7a4]
  - @inlang/sdk@0.34.10
  - @inlang/rpc@0.3.21
  - @inlang/settings-component@1.0.16
  - @inlang/telemetry@0.3.36

## 1.44.1

### Patch Changes

- Updated dependencies [a958d91]
  - @inlang/sdk@0.34.9
  - @inlang/rpc@0.3.20
  - @inlang/settings-component@1.0.15
  - @inlang/telemetry@0.3.35

## 1.44.0

### Minor Changes

- b8dbc58: add commands to command palette

### Patch Changes

- 6bb1b60: improve docs & README
- d1a2286: improve missing repository error message
- Updated dependencies [10dbd02]
  - @inlang/sdk@0.34.8
  - @inlang/rpc@0.3.19
  - @inlang/settings-component@1.0.14
  - @inlang/telemetry@0.3.34

## 1.43.0

### Minor Changes

- 5220b0e: add machine translations to context menu + improve visual recognition
- 1fb1e77: Update openInEditor command title and add branch parameter

## 1.42.12

### Patch Changes

- Updated dependencies [5209b81]
  - @inlang/sdk@0.34.7
  - @inlang/rpc@0.3.18
  - @inlang/settings-component@1.0.13
  - @inlang/telemetry@0.3.33

## 1.42.11

### Patch Changes

- Updated dependencies [f38536e]
  - @inlang/sdk@0.34.6
  - @inlang/rpc@0.3.17
  - @inlang/settings-component@1.0.12
  - @inlang/telemetry@0.3.32

## 1.42.10

### Patch Changes

- 955733d: release latest README changes

## 1.42.9

### Patch Changes

- 05af646: Use workspace:\* for settings-component
- Updated dependencies [b9eccb7]
  - @inlang/sdk@0.34.5
  - @inlang/rpc@0.3.16
  - @inlang/settings-component@1.0.11
  - @inlang/telemetry@0.3.31

## 1.42.8

### Patch Changes

- Updated dependencies [2a90116]
  - @inlang/sdk@0.34.4
  - @inlang/rpc@0.3.15
  - @inlang/settings-component@1.0.9
  - @inlang/telemetry@0.3.30

## 1.42.7

### Patch Changes

- 08d47f0: publish script update after local test

## 1.42.6

### Patch Changes

- 93a9a17: update publish script

## 1.42.5

### Patch Changes

- 9b740ef: update publishing script
- Updated dependencies [8805b80]
  - @inlang/telemetry@0.3.29

## 1.42.4

### Patch Changes

- 1ccc4cd: update publishing script

## 1.42.3

### Patch Changes

- 8fa9f40: update MARKETPLACE structure

## 1.42.2

### Patch Changes

- b347253: update auto publishing for open vsx

## 1.42.1

### Patch Changes

- dec4bf1: fix settings component

## 1.42.0

### Minor Changes

- 30a63b2: update getting started view to one click project creation

## 1.41.1

### Patch Changes

- Updated dependencies [bc17d0c]
  - @inlang/sdk@0.34.3
  - @inlang/rpc@0.3.14
  - @inlang/settings-component@1.0.7
  - @inlang/telemetry@0.3.28

## 1.41.0

### Minor Changes

- 89acef4: add ability to change the inline annotation color

## 1.40.0

### Minor Changes

- 1cfdca2: add ability to disable inline annotations

## 1.39.8

### Patch Changes

- b94ab60: fix wrong command name

## 1.39.7

### Patch Changes

- Updated dependencies [3c959bc]
  - @inlang/sdk@0.34.2
  - @inlang/rpc@0.3.13
  - @inlang/settings-component@1.0.6
  - @inlang/telemetry@0.3.27

## 1.39.6

### Patch Changes

- Updated dependencies [9165e64]
  - @lix-js/client@1.4.0
  - @inlang/sdk@0.34.1
  - @inlang/rpc@0.3.12
  - @inlang/settings-component@1.0.5
  - @inlang/telemetry@0.3.26

## 1.39.5

### Patch Changes

- Updated dependencies [5b8c053]
  - @inlang/sdk@0.34.0
  - @inlang/rpc@0.3.11
  - @inlang/settings-component@1.0.4
  - @inlang/telemetry@0.3.25

## 1.39.4

### Patch Changes

- cd9a3e1: add internal links
- Updated dependencies [c92bde5]
- Updated dependencies [7bd98e4]
- Updated dependencies [2508271]
- Updated dependencies [0b4af82]
  - @inlang/settings-component@1.0.3
  - @lix-js/client@1.3.0
  - @inlang/sdk@0.33.1
  - @inlang/rpc@0.3.10
  - @inlang/telemetry@0.3.24

## 1.39.3

### Patch Changes

- Updated dependencies [4941ca4]
- Updated dependencies [d573ab8]
  - @lix-js/client@1.2.1
  - @inlang/sdk@0.33.0
  - @inlang/rpc@0.3.9
  - @inlang/settings-component@1.0.2
  - @inlang/telemetry@0.3.23

## 1.39.2

### Patch Changes

- b25aaab: fix prefferedLanguageTag auto-select

## 1.39.1

### Patch Changes

- 8b091e1: fix lint rules not showing when missing

## 1.39.0

### Minor Changes

- c9e578f: minor improvements to styling

## 1.38.2

### Patch Changes

- ef1ac34: fix settings view display

## 1.38.1

### Patch Changes

- Updated dependencies [552037b]
  - @inlang/settings-component@1.0.0

## 1.38.0

### Minor Changes

- 32c8b9f: release settings view

## 1.37.0

### Minor Changes

- 84268d5: introduce inlang settings component

### Patch Changes

- Updated dependencies [bc9875d]
  - @inlang/sdk@0.32.0
  - @inlang/rpc@0.3.8
  - @inlang/settings-component@0.0.16
  - @inlang/telemetry@0.3.22

## 1.36.8

### Patch Changes

- Updated dependencies [c068dd2]
  - @inlang/sdk@0.31.0
  - @inlang/rpc@0.3.7
  - @inlang/telemetry@0.3.21

## 1.36.7

### Patch Changes

- Updated dependencies [9b26a31]
  - @inlang/sdk@0.30.0
  - @inlang/rpc@0.3.6
  - @inlang/telemetry@0.3.20

## 1.36.6

### Patch Changes

- 62dfa26: SDK Breaking change: LintReports get() and getAll() are now async, and non-reactive.
  Reduces (does not eliminate) excessive sdk resource consumption.
- Updated dependencies [62dfa26]
  - @inlang/sdk@0.29.0
  - @inlang/rpc@0.3.5
  - @inlang/telemetry@0.3.19

## 1.36.5

### Patch Changes

- Updated dependencies [8a8aec7]
  - @lix-js/client@1.2.0
  - @inlang/sdk@0.28.3
  - @inlang/rpc@0.3.4
  - @inlang/telemetry@0.3.18

## 1.36.4

### Patch Changes

- 61b277b: update statusbar item

## 1.36.3

### Patch Changes

- 923a4bb: fix discord link

## 1.36.2

### Patch Changes

- Updated dependencies [d1b361e]
  - @lix-js/client@1.1.0
  - @inlang/sdk@0.28.2
  - @inlang/rpc@0.3.3
  - @inlang/telemetry@0.3.17

## 1.36.1

### Patch Changes

- Updated dependencies [03fa6f2]
  - @lix-js/client@1.0.0
  - @lix-js/fs@1.0.0
  - @inlang/sdk@0.28.1
  - @inlang/rpc@0.3.2
  - @inlang/telemetry@0.3.16

## 1.36.0

### Minor Changes

- 8721ce8: add machine translate

### Patch Changes

- Updated dependencies [1e43ae4]
  - @inlang/sdk@0.28.0
  - @inlang/rpc@0.3.1
  - @inlang/telemetry@0.3.15

## 1.35.0

### Minor Changes

- 4305883: introduce alias rendering with experimental human readable ids

## 1.34.0

### Minor Changes

- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }

### Patch Changes

- Updated dependencies [4837297]
  - @inlang/sdk@0.27.0
  - @lix-js/client@0.9.0
  - @inlang/telemetry@0.3.14

## 1.33.0

### Minor Changes

- fee938e1c: update variables to branding under the hood

## 1.32.9

### Patch Changes

- @inlang/sdk@0.26.5
- @inlang/telemetry@0.3.13

## 1.32.8

### Patch Changes

- 960f8fb70: rename the vscode extension to "Sherlock"
  - @inlang/sdk@0.26.4
  - @inlang/telemetry@0.3.12

## 1.32.7

### Patch Changes

- b0d016e93: Use latest chromedriver to help CI install

## 1.32.6

### Patch Changes

- 22336898c: Subscribe message view to sdk message changes for dynamic updates

## 1.32.5

### Patch Changes

- d9cf66170: update docs for apps and plugins

## 1.32.4

### Patch Changes

- f5f65581e: remove commands from command palette

## 1.32.3

### Patch Changes

- @inlang/sdk@0.26.3
- @inlang/telemetry@0.3.11

## 1.32.2

### Patch Changes

- 073c78864: Changed the hreft from the 'create project’ button in the IDE extension and update docs
- 4e8cafcdd: remove missing custom api setings decoration in settings file
- 9ed82b43d: disable sentry error logging for now

## 1.32.1

### Patch Changes

- 611d058d4: scope sentry logging to activate function of extension
  - @inlang/sdk@0.26.2
  - @inlang/telemetry@0.3.10

## 1.32.0

### Minor Changes

- b3090c279: fix env issues in Visual Studio Code extension (Sherlock)

## 1.31.0

### Minor Changes

- 2f160c130: refactor: clean up env variable usage

## 1.30.2

### Patch Changes

- 431ee545d: add sentry error monitoring

## 1.30.1

### Patch Changes

- 30e03afa5: fix potential reactivity issue

## 1.30.0

### Minor Changes

- 7037bc8b3: remove outdated "configure replacement options" prompt.

  - https://github.com/opral/monorepo/discussions/2159#discussioncomment-8325600

## 1.29.4

### Patch Changes

- 008313fa1: fix message view layout

## 1.29.3

### Patch Changes

- d646e6f66: add jump to message position in code

## 1.29.2

### Patch Changes

- f7dc963df: add inline annotation language switching

## 1.29.1

### Patch Changes

- Updated dependencies [3bf94ddb5]
  - @lix-js/client@0.8.0
  - @inlang/sdk@0.26.1
  - @inlang/telemetry@0.3.9

## 1.29.0

### Minor Changes

- c98ea1dfe: refactor: internal change how projects are identified

## 1.28.3

### Patch Changes

- f26c19758: fix Fink url for cross-selling

## 1.28.2

### Patch Changes

- 365fd5610: update readme & recommendation view

## 1.28.1

### Patch Changes

- 9a55e9390: update codicon location

## 1.28.0

### Minor Changes

- f2b4e23e5: add Sherlock tab

### Patch Changes

- 870143a22: update import with workspaceFolder

## 1.27.0

### Minor Changes

- 676c0f905: remove deprecated loadProject({nodeishFs})

### Patch Changes

- Updated dependencies [676c0f905]
  - @inlang/sdk@0.26.0
  - @inlang/telemetry@0.3.8

## 1.26.0

### Minor Changes

- 2f55a1a0d: chore: add project group identify

### Patch Changes

- Updated dependencies [87bed968b]
- Updated dependencies [23ca73060]
  - @inlang/sdk@0.25.0
  - @inlang/create-project@1.1.8
  - @inlang/telemetry@0.3.7

## 1.25.5

### Patch Changes

- @inlang/sdk@0.24.1
- @inlang/create-project@1.1.7
- @inlang/telemetry@0.3.6

## 1.25.4

### Patch Changes

- Updated dependencies [c38faebce]
  - @inlang/sdk@0.24.0
  - @lix-js/fs@0.6.0
  - @inlang/create-project@1.1.6
  - @inlang/telemetry@0.3.5

## 1.25.3

### Patch Changes

- Updated dependencies [b920761e6]
  - @inlang/sdk@0.23.0
  - @inlang/create-project@1.1.5
  - @inlang/telemetry@0.3.4

## 1.25.2

### Patch Changes

- Updated dependencies [cd29edb11]
  - @inlang/sdk@0.22.0
  - @inlang/create-project@1.1.4
  - @inlang/telemetry@0.3.3

## 1.25.1

### Patch Changes

- Updated dependencies [e20364a46]
  - @inlang/sdk@0.21.0
  - @lix-js/fs@0.5.0
  - @inlang/create-project@1.1.3
  - @inlang/telemetry@0.3.2

## 1.25.0

### Minor Changes

- bc5803235: hotfix reactivity bug in ide extension

### Patch Changes

- Updated dependencies [bc5803235]
  - @inlang/sdk@0.20.0
  - @inlang/create-project@1.1.2
  - @inlang/telemetry@0.3.1

## 1.24.0

### Minor Changes

- 013a0923b: fix windows close project selection bug

## 1.23.0

### Minor Changes

- 1d0f167b4: Bug fix of internal #195

### Patch Changes

- Updated dependencies [1d0f167b4]
  - @inlang/telemetry@0.3.0

## 1.22.0

### Minor Changes

- e237b4942: chore: update SDK dependency and support for project directories

## 1.21.1

### Patch Changes

- @inlang/telemetry@0.2.1

## 1.21.0

### Minor Changes

- 82ccb9e80: add quote stripping to extract messages in Visual Studio Code extension (Sherlock)
- cc3c17d8a: add resolve string escape for inline preview

## 1.20.0

### Minor Changes

- Adjust publish script to publish to marketplace

## 1.19.0

### Minor Changes

- change logo of Visual Studio Code extension (Sherlock)

## 1.18.0

### Minor Changes

- 6e1fddf71: update watch & README + MARKETPLACE

## 1.17.0

### Minor Changes

- ae3cad41c: latest bugfixes

## 1.16.0

### Minor Changes

- 9d754d722: add watch to fs

### Patch Changes

- Updated dependencies [9d754d722]
  - @lix-js/fs@0.4.0

## 1.15.0

### Minor Changes

- 452553bed: remove reload prompt instead silent reload
- 39beea7dd: change return type of extractMessageOptions

## 1.14.0

### Minor Changes

- 77ed7a85c: update deps

## 1.13.0

### Minor Changes

- 3bfc38121: Use configured proxy for requests from ide-extension, if available

## 1.12.0

### Minor Changes

- a3bd1b72f: fix: show inlang logo as extension icon

### Patch Changes

- Updated dependencies [6f42758bb]
  - @lix-js/fs@0.3.0

## 1.11.0

### Minor Changes

- a1f3f064b: improve: tryAutoGenProjectSettings

  - Only prompts the user if the settings can actually be generated.

  refactor: remove unused code

## 1.10.0

### Minor Changes

- 241a37328: Refactor event emitters

## 1.9.0

### Minor Changes

- e336aa227: clean up command configuration

## 1.8.0

### Minor Changes

- b7dfc781e: change message format match from object to array

## 1.7.0

### Minor Changes

- 9df069d11: quickfix: Visual Studio Code extension (Sherlock) config create

## 1.6.0

### Minor Changes

- 564a2df5: improved the wording of the automatic settings file prompt

## 1.5.0

### Minor Changes

- 8bf4c07a: fix lint reactivity bug & migrate

## 1.4.0

### Minor Changes

- 1df3ba43: improve auto settings & ide extension structure

## 1.3.0

- updated dependencies

## 1.2.0

### Minor Changes

- 0f925704: fix env

## 1.1.0

### Minor Changes

- 973858c6: chore(fix): remove unpublished dependency which lead to installation failing

### Patch Changes

- Updated dependencies [973858c6]
  - @inlang/telemetry@0.2.0
  - @inlang/result@1.1.0
  - @lix-js/fs@0.2.0

## 0.9.3

### Patch Changes

- 1bd24020: Fixes an error so placeholders are displayed in message previews.

## 0.9.2

### Patch Changes

- 68504fbc: update README

## 0.9.1

### Patch Changes

- ce0c2566: add jsonc parser for extensions.json parsing

## 0.9.0

### Minor Changes

- 9ff20754: Add context tooltip, which lets you view all localizations of a message, edit and open them in the editor.
- 823cec8a: add lints to ide extension

## 0.8.1

### Patch Changes

- 06b12597: Adjust loading inlangs config so it is compatible with Windows
- 543231e4: Fixes telemtry in ide-extension, so it won't crash if there is no git.

## 0.8.0

### Minor Changes

- 283f5764: Several performance improvements.

### Patch Changes

- 943e29c1: added a missing group identifier event

## 0.7.6

### Patch Changes

- 584e436b: Updated to new plugin-json link from monorepo

## 0.7.5

### Patch Changes

- 66519584: Fixes https://github.com/opral/monorepo/issues/927

## 0.7.4

### Patch Changes

- 3657b5ea: fix config not loading because of wrong path detection
- 11452575: remove telemetry events "decoration set" and "code action provided"

## 0.7.3

### Patch Changes

- 97092de0: fix config not loading because of wrong path detection
- 97092de0: remove telemetry events "decoration set" and "code action provided"

## 0.7.2

### Patch Changes

- 719c1e8b: internal refacotring

## 0.7.1

### Patch Changes

- 66e85ac1: Fix: Importing local JavaScript files via $import() has been fixed.
- c9208cc6: capture the used configs for roadmap priorization
- 7f4e79bb: add telemetry for recommended in workspace

## 0.7.0

### Minor Changes

- 16f4307f: add recommendation prompt
- d9ff0e23: change recommendation key to "disableRecommendation"

## 0.6.4

### Patch Changes

- 1cad35e9: persist user with id

## 0.6.3

### Patch Changes

- 04f5ac93: The ide extension config has been moved back into @inlang/core. For more information, read https://github.com/opral/monorepo/issues/856.
- Updated dependencies [04f5ac93]
  - @inlang/core@0.9.0

## 0.6.2

### Patch Changes

- b3e868f1: remove monorepo config parsing and add warning to config if no ide extension properties are set

## 0.6.1

### Patch Changes

- 04f81ae8: Minor refactorings

## 0.6.0

### Minor Changes

- 9cd701a3: The Visual Studio Code extension (Sherlock) should now work for the majority of projects.

  We fixed a problem that blocked the Visual Studio Code extension (Sherlock) for months. The extension transpiles ESM under the hood to CJS now because Electron, and thus Visual Studio Code, do not support ESM.

## 0.5.9

### Patch Changes

- @inlang/core@0.8.6

## 0.5.8

### Patch Changes

- @inlang/core@0.8.5

## 0.5.7

### Patch Changes

- a9b71575: fix: dynamic import

## 0.5.6

### Patch Changes

- 4147156d: refactor esm imports

## 0.5.5

### Patch Changes

- 5c6d472e: update settings for plugins
- Updated dependencies [5c6d472e]
  - @inlang/core@0.8.4

## 0.5.4

### Patch Changes

- 652de069: update for ide extension release
- 89f0c7a2: update vs-code-extension

## 0.5.3

### Patch Changes

- Updated dependencies [6bf22450]
- Updated dependencies [61190e25]
  - @inlang/core@0.5.3

## 0.5.1

### Patch Changes

- @inlang/core@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [a0b85eb]
- Updated dependencies [e9e9ce5]
  - @inlang/core@0.5.0

## 0.4.3

### Patch Changes

- Updated dependencies [fc30d4b]
  - @inlang/core@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies [f28da6b]
- Updated dependencies [f28da6b]
- Updated dependencies [f28da6b]
  - @inlang/core@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies [e5a88c8]
  - @inlang/core@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [1d756dd]
- Updated dependencies [a4b9fce]
  - @inlang/core@0.4.0
