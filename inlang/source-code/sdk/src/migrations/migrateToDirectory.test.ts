import { test, expect, vi } from "vitest";
import { maybeMigrateToDirectory } from "./migrateToDirectory.js";
import { createNodeishMemoryFs } from "@lix-js/fs";
import type { ProjectSettings } from "@inlang/project-settings";

test("it should return if the settings file has an error (let loadProject handle it)", async () => {
  const projectPath = "./project.inlang";
  const mockFs = {
    stat: vi.fn(() => {}),
    readFile: vi.fn(() => {
      throw Error();
    }),
  };
  await maybeMigrateToDirectory({ nodeishFs: mockFs as any, projectPath });
  // something goes wrong in readFile
  expect(mockFs.readFile).toHaveBeenCalled();
});

test("it should create the project directory if it does not exist and a project settings file exists", async () => {
  const projectPath = "./project.inlang";
  const mockFs = {
    readFile: vi.fn(
      () => `{
			"sourceLanguageTag": "en",
			"languageTags": ["en", "de"],
			"modules": []
		}`,
    ),
    stat: vi.fn(() => {
      throw Error();
    }),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  };
  await maybeMigrateToDirectory({ nodeishFs: mockFs as any, projectPath });
  expect(mockFs.mkdir).toHaveBeenCalled();
  expect(mockFs.writeFile).toHaveBeenCalled();
});

test("it should write the settings file to the new path", async () => {
  const fs = createNodeishMemoryFs();
  const mockSettings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["en", "de"],
    modules: [],
  };
  await fs.writeFile("./project.inlang.json", JSON.stringify(mockSettings));
  await maybeMigrateToDirectory({
    nodeishFs: fs,
    projectPath: "./project.inlang",
  });
  const migratedSettingsFile = await fs.readFile(
    "./project.inlang/settings.json",
    {
      encoding: "utf-8",
    },
  );
  expect(migratedSettingsFile).toEqual(JSON.stringify(mockSettings));
  expect(await fs.stat("./project.inlang.README.md")).toBeDefined();
});
