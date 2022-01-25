# ABANDONED FOR NOW

The VSCode extension will come back but for now we will focus on the core product: the dashboard.

Open questions:

-   it needs to be configured. We opted for a json file in the source code similar to eslint etc. but is that ideal?
-   the wrapping pattern needs to adopt to different environments within one project e.g. the wrapping pattern for markup differs from scripts. Which architecture works across different envs?

As long as the questions above are not eloborated, the extension is on hold.

---

The VSCode extension adds a "Send to inlang" command to the context menu. The command automatically sends the selected text/string as base translation to the inlang dashboard together with the key.

![Github](https://github.com/inlang/inlang/blob/398c091946621083fd3d4da56957ccee71cbfcda/assets/step1.gif?raw=true)

## Getting started

1. Get your project id from settings on the dashboard.
2. Add `inlang.config.json` to your root directory with the following structure:

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
