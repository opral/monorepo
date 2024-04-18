import type { RepoState } from "./repoState.js"

export const lixFs = (nodeishFs: RepoState["nodeishFs"]) => ({
	read(path: string) {
		return nodeishFs.readFile(path, { encoding: "utf-8" })
	},
	write(path: string, content: string) {
		return nodeishFs.writeFile(path, content)
	},
	listDir(path: string) {
		return nodeishFs.readdir(path)
	},
})
