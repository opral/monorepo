# Restore

Restore enables applications to revert to a previous state using any change set ID, providing a powerful safety net for users. This is especially useful when [working with AI agents](./lix-for-ai-agents), as it provides a way to recover from unintended changes.

![Restore](/restore.svg)

## Examples

### Restore to the last change set

<CodeSnippet
module={example}
srcCode={exampleSrcCode}
sections={["restore-last-changeset"]}
/>

### Create and use a checkpoint

<CodeSnippet
module={example}
srcCode={exampleSrcCode}
sections={["checkpoint-restore"]}
/>
