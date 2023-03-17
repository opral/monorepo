import fs from "node:fs"

// change name of package
// see https://github.com/microsoft/vscode-vsce/issues/186
const packageJson = JSON.parse(fs.readFileSync("./package.json"))
packageJson.name = "vs-code-extension"
fs.writeFileSync("./package.json", JSON.stringify(packageJson, undefined, 2))
