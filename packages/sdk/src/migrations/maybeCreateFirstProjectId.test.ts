import { generateProjectId } from "./maybeCreateFirstProjectId.js";
import { it, expect } from "vitest";
import { mockRepo } from "@lix-js/client";
import { type Snapshot } from "@lix-js/fs";
// eslint-disable-next-line no-restricted-imports -- test
import { readFileSync } from "node:fs";

const ciTestRepo: Snapshot = JSON.parse(
  readFileSync("./mocks/ci-test-repo-no-shallow.json", { encoding: "utf-8" }),
);
const repo = await mockRepo({ fromSnapshot: ciTestRepo as Snapshot });

it("should return if repo is undefined", async () => {
  const projectId = await generateProjectId({
    repo: undefined,
    projectPath: "mocked_project_path",
  });
  expect(projectId).toBeUndefined();
});

it("should generate a project id", async () => {
  const projectId = await generateProjectId({
    repo,
    projectPath: "mocked_project_path",
  });
  expect(projectId).toBe(
    "432d7ef29c510e99d95e2d14ef57a0797a1603859b5a851b7dff7e77161b8c08",
  );
});

it("should return undefined if repoMeta contains error", async () => {
  await repo.nodeishFs.rm("/.git", { recursive: true });

  const projectId = await generateProjectId({
    repo: repo,
    projectPath: "mocked_project_path",
  });
  expect(projectId).toBeUndefined();
});
