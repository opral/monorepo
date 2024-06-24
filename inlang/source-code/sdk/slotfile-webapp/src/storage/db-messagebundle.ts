import { addRxPlugin } from "rxdb"
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder"
import { createNodeishMemoryFs } from "@lix-js/client"
import { loadProject, create, createNewProject } from "@inlang/sdk/v2"
import http from "isomorphic-git/http/web"

// NOTE: I use isomorphic git because i went crazy with cors :-/ was faster to spin up a iso proxy
import git, { pull, add, commit, push, statusMatrix } from "isomorphic-git"
const fs = createNodeishMemoryFs()


addRxPlugin(RxDBQueryBuilderPlugin)

// NOTE: All those properties are hardcoded for now - dont get crazy ;-) #POC
const gittoken = "YOUR_GITHUB_TOKEN_HERE"
const corsProxy = "http://localhost:9998" // cors Proxy expected to run - start it via pnpm run proxy
const repoUrl = "https://github.com/martin-lysk/message-bundle-storage"
const dir = "/"

const createAwaitable = () => {
	let resolve: () => void
	let reject: () => void

	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})

	return [promise, resolve!, reject!] as [
		awaitable: Promise<void>,
		resolve: () => void,
		reject: (e: unknown) => void
	]
}

const _create = async (fs: any) => {
	await git.clone({
		fs: fs,
		http,
		dir: dir,
		corsProxy: corsProxy,
		url: repoUrl,
		singleBranch: true,
		depth: 1,
	})

	// we don't use any of the repo funciton for now
	const repo = {
		nodeishFs: fs,
		getFirstCommitHash: () => "dummy_first_hash",
	} as any

	try {
		await createNewProject({
			projectPath: "/testproject.inlang",
			repo: repo,
		})
	} catch (e) {
		console.warn("existed already")
	}

	const inlangProject = await loadProject({
		projectPath: "/testproject.inlang",
		repo: repo,
	})

	const pullChangesAndReloadSlots = async () => {
		await pull({
			fs,
			http,
			dir: dir,
			author: {
				email: "user@user.de",
				name: "Meeee",
			},
		})
		await inlangProject.internal.bundleStorage.loadSlotFilesFromWorkingCopy(true)
		await inlangProject.internal.messageStorage.loadSlotFilesFromWorkingCopy(true)
	}

	const pushChangesAndReloadSlots = async () => {
		await push({
			fs,
			http,
			dir,
			onAuth: () => {
				return { username: gittoken }
			},
		})
		await inlangProject.internal.bundleStorage.loadSlotFilesFromWorkingCopy(true)
		await inlangProject.internal.messageStorage.loadSlotFilesFromWorkingCopy(true)
	}

	let ongoingCommit = undefined as any

	const commitChanges = async () => {
		if (ongoingCommit) {
			await ongoingCommit.then(commitChanges)
			return
		}

		const awaitable = createAwaitable()
		ongoingCommit = awaitable[0]
		const done = awaitable[1]

		const FILE = 0,
			WORKDIR = 2,
			STAGE = 3
		const filenames = (
			await statusMatrix({
				dir: dir,
				fs: fs,
			})
		)
			.filter((row) => row[WORKDIR] !== row[STAGE])
			.map((row) => row[FILE])

		if (filenames.length == 0) {
			return
		}

		await add({
			dir: dir,
			fs: fs,
			filepath: filenames,
		})

		try {
			await commit({
				dir: dir,
				fs: fs,
				message: "db commit",
				author: {
					email: "test@test.te",
					name: "jojo",
				},
			})
		} catch (e) {
			// eslint-disable-next-line no-console
			console.log(e)
		}
		ongoingCommit = undefined
		done()
	}

	return { inlangProject, fs, pullChangesAndReloadSlots, pushChangesAndReloadSlots, commitChanges }
}

export const storage = _create(fs)
