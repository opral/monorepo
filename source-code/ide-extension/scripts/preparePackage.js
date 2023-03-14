import('node:fs').then((fs) => {
  // change name of package
  // see https://github.com/microsoft/vscode-vsce/issues/186
  const packageJson = JSON.parse(fs.readFileSync('./package.json'));
  packageJson.name = 'inlang';
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, undefined, 2));
});
