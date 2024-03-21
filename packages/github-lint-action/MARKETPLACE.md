<doc-image src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/github-lint-action/assets/ninja-i18n-cover.png"></doc-image>

# Automate your i18n linting for pull requests

Ensure that your i18n files are always up to date with the latest changes in your source code.

## Features

- Automated i18n linting for pull requests
- Detection of new broken inlang projects
- Comment creation with issue report
- Link creation to fix issues directly in [Fink localization editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor)

## Getting Started

Please ensure you have set up an [inlang project](https://inlang.com//documentation/concept/project) with [lint rules](https://inlang.com/c/lint-rules) in your repository.

Add the following workflow file to your repository in this path `.github/workflows/ninja-i18n.yml`

```yml
name: Ninja i18n action

on:
  pull_request_target:

# explicitly configure permissions, in case your GITHUB_TOKEN workflow permissions are set to read-only in repository settings
permissions: 
  pull-requests: write

jobs:
  ninja-i18n:
    name: Ninja i18n - GitHub Lint Action
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Run Ninja i18n
        id: ninja-i18n
        uses: opral/ninja-i18n-action@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
```

**Note:** The `opral/ninja-i18n-action` is tagged to always use the latest commit on `main`. This ensures that you always get the latest version of the action. Since the repository is only used for publishing the action, it is safe to use the `main` branch.

### Environmental Variables:

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `GITHUB_TOKEN`        | _required_ | Usage: `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`,  Ninja i18n action uses this in-built GitHub token to make the API calls for interacting with GitHub. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|

## Workflow

<doc-video src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/github-lint-action/assets/Ninja-showcase.mp4"></doc-video>

- When a pull request is opened or updated, the action will run and check for new i18n issues.
- If issues are found, the action creates a comment on the pull request with an issues report including links to the Fink localization editor to resolve the issues.
- After the issues are resolved, the action will automatically update the pull request comment to reflect the changes.
- If no issues are found, the action will simply not create any comments.