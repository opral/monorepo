# inlang-vscode-extension

Adds "Send to Inlang" to the context menu, which automatically sends the text selected as a base translation to the Inlang dashboard together with the key. The selected text is then replaced with the keyname and wrapping pattern desired.

## Getting started

1. Get your project id from settings on the dashboard.
2. Add `inlang.json` to your root directory with the following structure:

```
  {
    "projectId": "your-project-id",
    "vsCodeExtension":{
      "wrappingPattern": "$LL.keyname()"
    }
  }
```

3. Write the desired base translation in your source code.
4. Right click to open the context menu and choose "Send to Inlang".
5. Done!
