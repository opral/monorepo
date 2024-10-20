import { assert, describe, it, expect } from "vitest";
import { listProjects } from "./listProjects.js";
import { createNodeishMemoryFs, type Snapshot } from "@lix-js/fs";
import type { ProjectSettings } from "@inlang/project-settings";
import { mockRepo } from "@lix-js/client";
// eslint-disable-next-line no-restricted-imports -- test
import { readFileSync } from "node:fs";

const settings: ProjectSettings = {
  sourceLanguageTag: "en",
  languageTags: ["en"],
  modules: ["plugin.js", "lintRule.js"],
  messageLintRuleLevels: {
    "messageLintRule.project.missingTranslation": "error",
  },
  "plugin.project.i18next": {
    pathPattern: "./examples/example01/{languageTag}.json",
    variableReferencePattern: ["{", "}"],
  },
};

describe("listProjects", () => {
  it("should find all projects a given path", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir("/user/dir1/project.inlang", { recursive: true });
    await fs.writeFile(
      "/user/dir1/project.inlang/settings.json",
      JSON.stringify(settings),
    );
    await fs.mkdir("/user/dir2/project.inlang", { recursive: true });
    await fs.writeFile(
      "/user/dir2/project.inlang/settings.json",
      JSON.stringify(settings),
    );

    await listProjects(fs, "/user").then((projects) => {
      assert(projects.length === 2);
    });
  });

  it("should return objects inside of an array with the projectPath", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir("/user/dir1/project.inlang", { recursive: true });
    await fs.writeFile(
      "/user/dir1/project.inlang/settings.json",
      JSON.stringify(settings),
    );
    await fs.mkdir("/user/dir2/project.inlang", { recursive: true });
    await fs.writeFile(
      "/user/dir2/project.inlang/settings.json",
      JSON.stringify(settings),
    );

    await listProjects(fs, "/user").then((projects) => {
      assert.isTrue(typeof projects[0] === "object");
      assert.isTrue(typeof projects[0]?.projectPath === "string");
    });
  });

  it("should limit the recursion depth to 5", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir("/user/dir1/dir2/dir3/dir4/dir5/dir6/project.inlang", {
      recursive: true,
    });
    await fs.writeFile(
      "/user/dir1/dir2/dir3/dir4/dir5/dir6/project.inlang/settings.json",
      JSON.stringify(settings),
    );

    await listProjects(fs, "/user").then((projects) => {
      assert(projects.length === 0);
    });
  });

  it("should not crash on broken symlinks as cal.com has", async () => {
    const ciTestRepo: Snapshot = JSON.parse(
      readFileSync("./mocks/ci-test-repo-no-shallow.json", {
        encoding: "utf-8",
      }),
    );
    const repo = await mockRepo({
      fromSnapshot: ciTestRepo,
      repoOptions: {
        experimentalFeatures: { lixCommit: true, lazyClone: false },
      },
    });
    repo.checkout({ branch: "test-symlink" });

    const link = await repo.nodeishFs.readlink(
      "test-symlink-not-existing-target",
    );

    expect(link).toBe("/test-symlink-not-existing-target//.././no-exist");

    await listProjects(repo.nodeishFs, "/").then((projects) => {
      assert(projects.length === 1);
    });
  });

  it("should also find files inside of a dir that ends with *.inlang", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir("/user/dir1/go.inlang", { recursive: true });
    await fs.writeFile(
      "/user/dir1/go.inlang/settings.json",
      JSON.stringify(settings),
    );
    await fs.mkdir("/user/dir2/flutter.inlang", { recursive: true });
    await fs.writeFile(
      "/user/dir2/flutter.inlang/settings.json",
      JSON.stringify(settings),
    );

    await listProjects(fs, "/user").then((projects) => {
      assert(projects.length === 2);
    });
  });
});
