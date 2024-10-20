// eslint-disable-next-line no-restricted-imports
import realNodeFs from "node:fs/promises";
import type { NodeishFilesystem } from "./NodeishFilesystemApi.js";
import { expectType } from "tsd";

const mockFs: NodeishFilesystem = {} as any;

// Filesystem must be a subset of node:fs/promises, "watch" type does not match due to type bug, so is excluded. If someone manages to fix this please do!
expectType<Omit<NodeishFilesystem, "watch">>(realNodeFs);

expectType<Uint8Array>(await mockFs.readFile("foo"));

expectType<string>(await mockFs.readFile("foo", { encoding: "utf-8" }));
