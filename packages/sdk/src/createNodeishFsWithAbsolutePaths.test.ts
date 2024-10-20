import { it, expect, vi } from "vitest";
import { createNodeishFsWithAbsolutePaths } from "./createNodeishFsWithAbsolutePaths.js";
// import type { NodeishFilesystemSubset } from "./versionedInterfaces.js"
import type { NodeishFilesystem } from "@lix-js/fs";

it("throws an error if projectPath is not an absolute path", () => {
  const relativePath = "relative/path";

  expect(() =>
    createNodeishFsWithAbsolutePaths({
      projectPath: relativePath,
      nodeishFs: {} as any,
    }),
  ).toThrow();
});

it("intercepts paths correctly for readFile", async () => {
  const projectPath = `/Users/samuel/Documents/paraglide/example/project.inlang`;

  const filePaths = [
    ["file.txt", `/Users/samuel/Documents/paraglide/example/file.txt`],
    ["./file.txt", `/Users/samuel/Documents/paraglide/example/file.txt`],
    [
      "./folder/file.txt",
      `/Users/samuel/Documents/paraglide/example/folder/file.txt`,
    ],
    ["../file.txt", `/Users/samuel/Documents/paraglide/file.txt`],
    ["../folder/file.txt", `/Users/samuel/Documents/paraglide/folder/file.txt`],
    ["../../file.txt", `/Users/samuel/Documents/file.txt`],
    ["../../../file.txt", `/Users/samuel/file.txt`],
  ];

  const mockNodeishFs = {
    readFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    writeFile: vi.fn(),
    watch: vi.fn(),
    rm: vi.fn(),
    stat: vi.fn(),
    lstat: vi.fn(),
    symlink: vi.fn(),
    unlink: vi.fn(),
    readlink: vi.fn(),
  } satisfies Record<keyof NodeishFilesystem, any>;

  const interceptedFs = createNodeishFsWithAbsolutePaths({
    projectPath,
    nodeishFs: mockNodeishFs,
  });

  for (const [path, expectedPath] of filePaths) {
    for (const fn of Object.keys(mockNodeishFs)) {
      await interceptedFs[fn](path);
      // @ts-expect-error
      // expect the first argument to be the expectedPath
      expect(mockNodeishFs[fn].mock.lastCall[0]).toBe(expectedPath);
    }
  }
});
