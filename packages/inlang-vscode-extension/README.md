# inlang-vscode-extension

Inlang is an open source localization (translation) solution for mobile and web apps with developer experience (DX) in mind. Don't (ab)use excel spreadsheets to manage translations, or modify JSON files manually. With inlang you get collaboration, type safety, machine translations and automatic sync in one tight package.

The VSCode extension adds a "Send to inlang" command to the context menu. The command automatically sends the selected text/string as base translation to the inlang dashboard together with the key.

![Github](https://github.com/inlang/inlang/blob/398c091946621083fd3d4da56957ccee71cbfcda/assets/step1.gif?raw=true)

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
