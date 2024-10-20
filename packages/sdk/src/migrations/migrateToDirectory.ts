import { tryCatch } from "@inlang/result";
import type { NodeishFilesystem } from "@lix-js/fs";

/**
 * Migrates to the new project directory structure
 * https://github.com/opral/monorepo/issues/1678
 */
export const maybeMigrateToDirectory = async (args: {
  nodeishFs: NodeishFilesystem;
  projectPath: string;
}) => {
  // the migration assumes that the projectPath ends with project.inlang
  if (args.projectPath.endsWith("project.inlang") === false) {
    return;
  }

  // we assume that stat will throw when the directory does not exist
  const projectDirectory = await tryCatch(() =>
    args.nodeishFs.stat(args.projectPath),
  );

  // the migration has already been conducted.
  if (projectDirectory.data) {
    return;
  }

  const settingsFile = await tryCatch(() =>
    args.nodeishFs.readFile(args.projectPath + ".json", { encoding: "utf-8" }),
  );

  // the settings file does not exist or something else is wrong, let loadProject handle it
  if (settingsFile.error) {
    return;
  }

  await args.nodeishFs.mkdir(args.projectPath);
  await args.nodeishFs.writeFile(
    `${args.projectPath}/settings.json`,
    settingsFile.data,
  );
  await args.nodeishFs.writeFile(args.projectPath + ".README.md", readme);

  // eslint-disable-next-line no-console
  // console.log("🔔 migrated project.inlang to directory")
};

const readme = `
# DELETE THE \`project.inlang.json\` FILE

The \`project.inlang.json\` file is now contained in a project directory e.g. \`project.inlang/settings.json\`.


## What you need to do

1. Update the inlang CLI (if you use it) to use the new path \`project.inlang\` instead of \`project.inlang.json\`.
2. Delete the \`project.inlang.json\` file.


## Why is this happening?

See this RFC https://docs.google.com/document/d/1OYyA1wYfQRbIJOIBDliYoWjiUlkFBNxH_U2R4WpVRZ4/edit#heading=h.pecv6xb7ial6 
and the following GitHub issue for more information https://github.com/opral/monorepo/issues/1678.

- Monorepo support https://github.com/opral/monorepo/discussions/258. 
- Required for many other future features like caching, first class offline support, and more. 
- Stablize the inlang project format.
`;
