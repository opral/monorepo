# 🥷 Ninja i18n [<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/assets/md-badges/inlang.svg" alt="inlang ecosystem compatible badge" align="right" width="243" height="36">](https://inlang.com)

Automate your i18n workflow and ensure that your i18n files are always up to date with the latest changes in your source code.

![Ninja i18n comment cover image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/github-lint-action/assets/ninja-i18n-cover.png)

## Workflow

https://github.com/opral/monorepo/assets/59048346/99049121-11db-4672-a7a8-e0d606426f4b

- When a pull request is opened or updated, the action will run and check for new i18n issues.
- If issues are found, the action creates a comment on the pull request with an issues report including links to the Fink localization editor to resolve the issues.
- After the issues are resolved, the action will automatically update the pull request comment to reflect the changes.
- If no issues are found, the action will simply not create any comments.

## Features

- Automated i18n linting for pull requests
- Detection of new broken inlang projects
- Comment creation with issue report
- Link creation to fix issues directly in [Fink localization editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor)

## Getting Started

Please ensure you have set up an [inlang project](https://inlang.com//documentation/concept/project) with [lint rules](https://inlang.com/c/lint-rules) in your repository.

Add the following workflow file to your repository in this path `.github/workflows/ninja_i18n.yml`

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

### Test if it works

Create a pull request with changes to your i18n files and see if the action runs and creates a comment with the issues report:

1. Create a new `test-ninja` branch in your repository
2. Open the `test-ninja` branch in [Fink localization editor](https://fink.inlang.com) and delete a translation for testing purposes
3. Commit and push the change
4. Create a pull request from the `test-ninja` branch to `main`
5. Check if the action runs and creates a comment with the issues report

[Click here to watch a video showing the above steps in GitHub](https://www.loom.com/share/c4d15fefb0854ca4b75a85cdb0d2c7e3)

### Environmental Variables:

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `GITHUB_TOKEN`        | _required_ | Usage: `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`,  Ninja i18n action uses this in-built GitHub token to make the API calls for interacting with GitHub. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|
