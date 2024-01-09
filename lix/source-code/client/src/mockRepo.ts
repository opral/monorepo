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

	// temporarily all test repos get same test metadata, this can be removed when repo ids are implemented
	repo.getMeta = async () => {
		return {
			id: "34c48e4ba4c128582466b8dc1330feac0733880b35f467f4161e259070d24a31",
			name: "ci-test-repo",
			isPrivate: false,
			isFork: true,
			permissions: { admin: false, push: false, pull: false },
			owner: { name: undefined, email: undefined, login: "inlang" },
			parent: { url: "github.com/inlang/example.git", fullName: "inlang/example" },
		}
	}

	return repo
}
