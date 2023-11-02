// eslint-disable-next-line no-restricted-imports
// import realNodeFs from "node:fs/promises"
import type { NodeishFilesystem } from "./NodeishFilesystemApi.js"
import { expectType } from "tsd"

const mockFs: NodeishFilesystem = {} as any

// Filesystem must be a subset of node:fs/promises.
// FIXME: cannot get types to match expectType<NodeishFilesystem>(realNodeFs)

expectType<Uint8Array>(await mockFs.readFile("foo"))

expectType<string>(await mockFs.readFile("foo", { encoding: "utf-8" }))
