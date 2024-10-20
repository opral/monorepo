import { describe, it, expect, vi } from "vitest";
import * as yaml from "js-yaml";
import { add, shouldRecommend, isAdopted } from "./index.js";
import { createNodeishMemoryFs } from "@lix-js/fs";

const githubConfig = `
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true

[remote "origin"]
	url = git@github.com:username/repository.git
	fetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
	remote = origin
	merge = refs/heads/main
`;

const gitlabConfig = `
[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true

[remote "origin"]
	url = git@gitlab.com:username/repository.git
	fetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
	remote = origin
	merge = refs/heads/main
`;
const ninjaI18nYaml = yaml.dump({
  name: "Ninja i18n action",
  on: "pull_request_target",
  jobs: {
    "ninja-i18n": {
      name: "Ninja i18n - GitHub Lint Action",
      "runs-on": "ubuntu-latest",
      steps: [
        {
          name: "Run Ninja i18n",
          id: "ninja-i18n",
          uses: "opral/ninja-i18n-action@main",
          env: {
            GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
          },
        },
      ],
    },
  },
});

vi.mock("js-yaml", async () => {
  const actual = (await vi.importActual("js-yaml")) as any;
  return {
    ...actual,
    load: vi.fn(actual.load),
    dump: vi.fn(actual.dump),
  };
});

describe("GitHub Actions Workflow Adoption Checks", async () => {
  it("detects adoption of Ninja i18n GitHub Action", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);
    await fs.mkdir(".github/workflows", { recursive: true });
    await fs.writeFile(".github/workflows/ninja_i18n.yml", ninjaI18nYaml);

    // expected to be false because the action is already adopted
    await expect(shouldRecommend({ fs })).resolves.toBe(false);
  });

  it("correctly adds the Ninja i18n GitHub Action workflow", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);
    await fs.mkdir(".github/workflows", { recursive: true });

    await add({ fs });

    // @ts-expect-error
    const writtenContent = await fs.readFile(
      ".github/workflows/ninja_i18n.yml",
      "utf8",
    );
    expect(writtenContent).toContain("name: Ninja i18n action");
    expect(writtenContent).toContain("uses: opral/ninja-i18n-action@main");
  });

  it("returns false if the repo is not hosted on GitHub", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", gitlabConfig);
    await fs.mkdir(".github/workflows", { recursive: true });

    await expect(shouldRecommend({ fs })).resolves.toBe(false);
  });

  it("does find action in deep nested directories within level 4", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);
    await fs.mkdir(".github/workflows/level1/level2/level3", {
      recursive: true,
    });
    await fs.writeFile(
      ".github/workflows/level1/level2/level3/ninja_i18n.yml",
      ninjaI18nYaml,
    );

    await expect(isAdopted({ fs })).resolves.toBe(true);
  });

  it("does not find the action in deep nested directories beyond level 4", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);
    await fs.mkdir(".github/workflows/level1/level2/level3/level4", {
      recursive: true,
    });
    await fs.writeFile(
      ".github/workflows/level1/level2/level3/level4/ninja_i18n.yml",
      ninjaI18nYaml,
    );

    await expect(isAdopted({ fs })).resolves.toBe(false);
  });

  it("returns false if checking directory existence throws an error", async () => {
    const fs = createNodeishMemoryFs();
    fs.stat = async () => {
      throw new Error("File not found");
    };

    await expect(shouldRecommend({ fs })).resolves.toBe(false);
  });

  it("returns true when the action is found in a nested directory within depth limit", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);
    await fs.mkdir(".github/workflows/level1", { recursive: true });
    await fs.writeFile(
      ".github/workflows/level1/ninja_i18n.yml",
      ninjaI18nYaml,
    );

    await expect(isAdopted({ fs })).resolves.toBe(true);
  });

  it("returns false and logs an error for malformed YAML content", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);
    await fs.mkdir(".github/workflows", { recursive: true });
    await fs.writeFile(
      ".github/workflows/ninja_i18n.yml",
      "malformed yaml content",
    );

    await expect(isAdopted({ fs })).resolves.toBe(false);
  });

  it("creates the workflow directory if it does not exist", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir(".git");
    await fs.writeFile(".git/config", githubConfig);

    await add({ fs });

    const exists = await fs.stat(".github/workflows");
    expect(exists.isDirectory()).toBe(true);
  });

  it("handles errors when creating the workflow directory in add function", async () => {
    const fs = createNodeishMemoryFs();
    fs.mkdir = async () => {
      throw new Error("Failed to create directory");
    };

    await expect(add({ fs })).rejects.toThrow("Failed to create directory");
  });

  it("detect workflow in the higher root directory if the working directory is in a subdirectory", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir("../../.git");
    await fs.writeFile("../../.git/config", githubConfig);
    await fs.mkdir("../../.github/workflows", { recursive: true });
    await fs.writeFile("../../.github/workflows/ninja_i18n.yml", ninjaI18nYaml);

    await expect(isAdopted({ fs })).resolves.toBe(true);
  });

  it("should add workflow in the higher root directory if the working directory is in a subdirectory", async () => {
    const fs = createNodeishMemoryFs();
    await fs.mkdir("../../.git");
    await fs.writeFile("../../.git/config", githubConfig);
    await fs.mkdir("../../subdir", { recursive: true });

    await add({ fs });

    const exists = await fs.stat("../../.github/workflows/ninja_i18n.yml");
    expect(exists.isFile()).toBe(true);
  });
});
