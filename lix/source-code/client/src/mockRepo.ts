import { openRepository } from "./openRepository.js"
import { createNodeishMemoryFs, fromSnapshot as loadSnapshot, type Snapshot } from "@lix-js/fs"
import isoGit from "isomorphic-git"
// @ts-ignore
// to load from json file JSON.parse(readFileSync("../mocks/ci-test-repo.json", { encoding: "utf-8" }))

export async function mockRepo({ fromSnapshot }: { fromSnapshot?: Snapshot } = {}) {
	const nodeishFs = createNodeishMemoryFs()

	if (fromSnapshot) {
		loadSnapshot(nodeishFs, fromSnapshot)
	} else {
		isoGit.init({ fs: nodeishFs, dir: "/" })
	}

	const repo = await openRepository("file://", {
		nodeishFs,
	})

	return repo
}
