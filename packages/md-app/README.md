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

1. Update @udecode/ dependencies with `npm-check-updates` or `ncu`
2. Install the latest version of the dependencies with

```bash
npx npm-check-updates '/@udecode\/plate.*/' -u
npm install
```

**Note:** This will only update the dependencies that start with `@udecode/plate`. You may need to update other dependencies manually or by running `ncu -u` for all dependencies.

3. Update the ui components and plugins by running `npx shadcx@latest add plate/editor-ai` to reinstall the latest version of the editor template.
4. Check the changes in source control to exclude any unwanted changes (e.g. files you modified before).
5. Test the editor in the app to ensure that it works as expected.

Taking a look at the [Plates Breaking Changes](https://github.com/udecode/plate/blob/main/BREAKING_CHANGES.md) and recent [Releases](https://github.com/udecode/plate/releases) might be helpful.