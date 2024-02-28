import type { NodeishFilesystem } from "@lix-js/fs"
import type raw from "isomorphic-git"
import type { Endpoints } from "@octokit/types"
import type { status, OptStatus } from "./git/status.js"

// TODO: restructure types to implementation and split up openRepository into smaller functions
export type Author = {
	name?: string
	email?: string
	timestamp?: number
	timezoneOffset?: number
}

export class LixError extends Error {
	// we currently mix standard errors with github errors and isomorphic git errors, we will start to transition into a clean lix error class as we replace implementations
	// the response object is added for transitional compatitbility with github sdk errors
	response?: { status?: number }
}

type StatusArgs = {
	// ref?: string support custom refs
	filepaths?: string[]
	filter?: (filepath: string) => boolean
	sparseFilter?: (entry: { filename: string; type: "file" | "folder" }) => boolean
	includeStatus?: OptStatus[]
}

// TODO: return type of openRepository instead of seperate type defs
export type Repository = {
	// we dont want to add isogit to types but its required for teting comparison and debugging
	[x: string]: any
	nodeishFs: NodeishFilesystem
	// state
	listRemotes: () => Promise<Awaited<ReturnType<typeof raw.listRemotes>> | undefined>
	log: (args?: {
		since?: Date
		depth?: number
		filepath?: string
		ref?: string
	}) => Promise<Awaited<ReturnType<typeof raw.log>>>
	status: (arg: string) => Promise<string>
	statusList: (arg?: StatusArgs) => ReturnType<typeof status>
	forkStatus: () => Promise<
		{ ahead: number; behind: number; conflicts: boolean } | { error: string }
	>
	// emptyWorkdir: () => Promise<void>
	getOrigin: () => Promise<string | undefined> // move to property
	getCurrentBranch: () => Promise<string | undefined> // move to property
	getBranches: () => Promise<string[] | undefined>
	errors: Subscribable<LixError[]> // move to property
	getFirstCommitHash: () => Promise<string | undefined>
	getMeta: () => Promise<
		| {
				name: string
				isPrivate: boolean
				isFork: boolean
				owner: { name?: string; email?: string; login: string }
				permissions: {
					admin: boolean
					pull: boolean
					push: boolean
				}
				parent?: {
					url: string
					fullName: string
				}
		  }
		| { error: Error }
	>

	// actions
	checkout: (args: { branch: string }) => Promise<void>
	commit: (args: {
		author?: Author
		message: string
		include: string[]
	}) => Promise<Awaited<ReturnType<typeof raw.commit>> | undefined>
	push: () => Promise<Awaited<ReturnType<typeof raw.push>> | undefined>
	pull: (args: { author: Author; fastForward: boolean; singleBranch: true }) => Promise<any>
	mergeUpstream: (args?: {
		branch?: string
	}) => Promise<
		Endpoints["POST /repos/{owner}/{repo}/merge-upstream"]["response"]["data"] | { error: any }
	>
	createFork: () => Promise<Endpoints["POST /repos/{owner}/{repo}/forks"]["response"]>

	// explicit branch api? repo.branches.main.read ? or similar
	// TODO: implement these before publishing api, but not used in badge or editor, depends on strategy for statelessness
	// currentBranch: () => unknown
	// changeBranch: () => unknown
}

export type Subscribable<Value> = {
	(): Value
	subscribe: (callback: (value: Value) => void) => void
}
