/**
 * Exports of the lisa client.
 */
export type LisaClient = {
	load: (
		path: string,
		options: {
			fs: unknown
			auth?: unknown
		},
	) => Promise<Repository>
}

export type Repository = {
	fs: any
	commit: () => unknown
	push: () => unknown
	pull: () => unknown
	currentBranch: () => unknown
	changeBranch: () => unknown
	listRemotes: () => unknown
	log: () => unknown
	status: () => any
}
