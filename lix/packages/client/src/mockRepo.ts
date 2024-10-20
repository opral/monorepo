import { openRepository } from "./openRepository.js";
import {
  createNodeishMemoryFs,
  fromSnapshot as loadSnapshot,
  type Snapshot,
} from "@lix-js/fs";
import isoGit from "../vendored/isomorphic-git/index.js";
// @ts-ignore
// to load from json file JSON.parse(readFileSync("../mocks/ci-test-repo.json", { encoding: "utf-8" }))
// TODO: allow json init support

export async function mockRepo({
  fromSnapshot,
  repoOptions,
}: {
  fromSnapshot?: Snapshot;
  repoOptions?: {
    experimentalFeatures: { lazyClone: boolean; lixCommit: boolean };
  };
} = {}) {
  const nodeishFs = createNodeishMemoryFs();

  if (fromSnapshot) {
    loadSnapshot(nodeishFs, fromSnapshot);
  } else {
    isoGit.init({ fs: nodeishFs, dir: "/" });
  }

  const repo = await openRepository("file://", {
    nodeishFs,
    ...(repoOptions || {}),
  });

  return repo;
}
