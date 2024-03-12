# 🥷 Ninja i18n - GitHub Lint Action

Automate your i18n workflow and ensure that your i18n files are always up to date with the latest changes in your source code.

#### Features

- Automated i18n linting for pull requests
- Detection of new broken inlang projects
- Comment creation with issue report
- Link creation to fix issues directly in [Fink localization editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor)

## Setup

Make sure you have an inlang project set up in your repository. If you don't have one yet, you can create one [here](https://inlang.com/documentation/concept/project).

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
        uses: opral/ninja-i18n@v0.2.2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
```

### Environmental Variables:

| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `GITHUB_TOKEN`        | _required_ | Usage: `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`,  Ninja i18n action uses this in-built GitHub token to make the API calls for interacting with GitHub. It is built into Github Actions and does not need to be manually specified in your secrets store. [More Info](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token)|

## Workflow

- When a pull request is opened or updated, the action will run and check for new i18n issues.
- If any issues are found, the action will create a comment on the pull request with a link to the Fink localization editor to fix the issues.
- After the issues are fixed, the action will automatically update the comment on the pull request to reflect the changes.
- If no issues are found, the action will simply not create any comments.
