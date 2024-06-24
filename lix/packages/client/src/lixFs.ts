import type { RepoState } from "./repoState.js"

export const lixFs = (nodeishFs: RepoState["nodeishFs"]) => ({
	read(path: string, { encoding }: { encoding: "binary" | "utf-8" } = { encoding: "utf-8" }) {
		return nodeishFs.readFile(path, { encoding })
	},
	write(path: string, content: string) {
		return nodeishFs.writeFile(path, content)
	},
	listDir(
		path: string,
		{ recursive, ignored = [] }: { recursive: boolean; ignored: string[] } = {
			recursive: false,
			ignored: [],
		}
	) {
		if (recursive) {
			async function allFiles(root = "/"): Promise<string[]> {
				const entries = await nodeishFs.readdir(root)
				const notIgnored = entries.filter((entry: string) => !ignored.includes(root + entry))
				const withMeta = await Promise.all(
					notIgnored.map(async (entry: string) => ({
						name: entry,
						isDir: (
							await nodeishFs.lstat(root + entry).catch((err: any) => {
								console.warn(err)
							})
						)?.isDirectory?.(),
					}))
				)
				const withChildren = await Promise.all(
					withMeta.map(async ({ name, isDir }) =>
						isDir ? allFiles(root + name + "/") : root + name
					)
				)
				return withChildren.flat().map((entry: string) => entry.replace(/^\//, ""))
			}

			return allFiles(path)
		}

		return nodeishFs.readdir(path)
	},
})
