// clone reposiory with isomorphic-git

import git from "isomorphic-git"
import http from "isomorphic-git/http/web/index.js"
import { publicEnv } from "@inlang/env-variables"
import fs from "./fs.js"

const cloneRespository = async (url: string) => {
	// parse url in the format of github.com/inlang/example and split it to host, owner and repo
	const [host, owner, repo] = [...url.split("/")]
	console.log(host, owner, repo)

	// check if all 3 parts are present, if not, return an error
	if (!host || !owner || !repo) {
		throw new Error(
			"Invalid url format for cloning repository, please use the format of github.com/inlang/example.",
		)
	}

	// clone the repository, resolves if the repository is cloned
	await git.clone({
		fs,
		http,
		dir: "/",
		// corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
		url: `https://${host}/${owner}/${repo}`,
		singleBranch: true,
		depth: 1,
	})
}

export default cloneRespository
