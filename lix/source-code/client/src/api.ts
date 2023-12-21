import type { NodeishFilesystem } from "@lix-js/fs"
import type raw from "isomorphic-git"
import type { Endpoints } from "@octokit/types"

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

export type LixAuthModule = {
	login: () => Promise<any>
	logout: () => Promise<any>
	getUser: () => Promise<{
		username: string
		email: string
		avatarUrl?: string
	}>
	addPermissions: () => Promise<any>
}

export type Repository = {
	// we dont want to add isogit to types but its required for teting comparison and debugging
	[x: string]: any
	nodeishFs: NodeishFilesystem
	commit: (args: {
		author: Author
		message: string
	}) => Promise<Awaited<ReturnType<typeof raw.commit>> | undefined>
	push: () => Promise<Awaited<ReturnType<typeof raw.push>> | undefined>
	pull: (args: { author: Author; fastForward: boolean; singleBranch: true }) => Promise<any>
	add: (args: { filepath: string }) => Promise<Awaited<ReturnType<typeof raw.add>>>
	listRemotes: () => Promise<Awaited<ReturnType<typeof raw.listRemotes>> | undefined>
	log: (args?: { since?: Date; depth?: number }) => Promise<Awaited<ReturnType<typeof raw.log>>>
	statusMatrix: (args: { filter: any }) => Promise<Awaited<ReturnType<typeof raw.statusMatrix>>>
	status: (args: { filepath: string }) => Promise<Awaited<ReturnType<typeof raw.status>>>
	mergeUpstream: (args?: {
		branch?: string
	}) => Promise<
		Endpoints["POST /repos/{owner}/{repo}/merge-upstream"]["response"]["data"] | { error: any }
	>
	createFork: () => Promise<Endpoints["POST /repos/{owner}/{repo}/forks"]["response"]>
	forkStatus: () => Promise<{ ahead: number; behind: number } | { error: string }>
	getOrigin: () => Promise<string>
	getCurrentBranch: () => Promise<string | undefined>
	getBranches: () => Promise<string[] | undefined>
	errors: Subscribable<LixError[]>
	getMeta: () => Promise<
		| {
				id: string
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

	// TODO: implement these before publishing api, but not used in badge or editor, depends on strategy for statelessness
	// currentBranch: () => unknown
	// changeBranch: () => unknown
}

export type Subscribable<Value> = {
	(): Value
	subscribe: (callback: (value: Value) => void) => void
}
