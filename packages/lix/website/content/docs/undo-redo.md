# Undo/Redo

Undo and redo are fundamental features for any application that involves editing. Lix provides simple `undo()` and `redo()` commands that are built on top of its robust history and restore capabilities.

This makes it easy to implement reliable undo/redo functionality in your application, allowing users to step backward and forward through their changes with confidence. You can even undo or redo multiple steps at once.

![Undo/Redo](/undo-redo.svg)

## Examples

<doc-code-snippet example="undo-redo" sections='["basic-undo-redo"]'></doc-code-snippet>
