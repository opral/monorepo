// clone reposiory with isomorphic-git

import { raw, http } from "@inlang-git/client/raw"
import type { NodeishFilesystem } from "@inlang-git/fs"

export async function cloneRespository(url: string, fs: NodeishFilesystem) {
	// parse url in the format of github.com/inlang/example and split it to host, owner and repo
	const [host, owner, repo] = [...url.split("/")]

	// check if all 3 parts are present, if not, return an error
	if (!host || !owner || !repo) {
		throw new Error(
			"Invalid url format for cloning repository, please use the format of github.com/inlang/example.",
		)
	}

	// clone the repository, resolves if the repository is cloned
	await raw.clone({
		fs,
		http,
		dir: "/",
		url: `https://${host}/${owner}/${repo}`,
		singleBranch: true,
		depth: 1,
	})
}
