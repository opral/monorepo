# Lix markdown app

This markdown app illustrates the benefits of using Lix in the context of document writing.

## Development

1. Clone the monorepo
2. Install dependencies `pnpm install`
3. Build `pnpm --filter md-app... build`
4. Start dev mode `pnpm --filter md-app dev`
5. (Optional) Add a .env file with `OPENAI_API_KEY="***"` and run `pnpm --filter lix-website-server dev` to enable AI features.

### Update Plate editor

The editor is based on the AI template of the Plate editor from udecode. To update the editor, follow these steps:

1. Navigate to the `md-app` directory with `cd packages/md-app`
2. Update @udecode/ dependencies with `npm-check-updates` or `ncu`
3. Install the latest version of the dependencies with

```bash
npx npm-check-updates '/@udecode\/plate.*/' -u
npm install
```

**Note:** This will only update the dependencies that start with `@udecode/plate`. You may need to update other dependencies manually or by running `ncu -u` for all dependencies.

4. Update the ui components and plugins by running `npx shadcx@latest add plate/editor-ai` to reinstall the latest version of the editor template.
5. Check the changes in source control to exclude any unwanted changes (e.g. files you modified before).
6. Test the editor in the app to ensure that it works as expected.

Check the [video guide](https://www.loom.com/share/d38e754c4dc041b1a66822c38141ef5b) on how to update the editor.

Taking a look at the [Plates Breaking Changes](https://github.com/udecode/plate/blob/main/BREAKING_CHANGES.md) and recent [Releases](https://github.com/udecode/plate/releases) might be helpful.