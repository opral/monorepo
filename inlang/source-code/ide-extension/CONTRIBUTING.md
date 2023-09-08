# Contributing to ide-extension

This package is a special case, because it needs compatibility with additional plattforms like Microsoft Windows and Apple OSx.

## Getting started

If you are on a POSIX-like system, you can stick to the repositories CONTRIBUTING.md file.

- It is convenient to set a inlang project, which is opened upon debugging the ide-extension. This can be done `.vscode/launch.json` in the second line of `args`.

### Windows

1. For executing the package scripts a Bash shell is needed. Install [git](https://git-scm.com/) and run `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`. This can be undone with `npm config delete script-shell`.
