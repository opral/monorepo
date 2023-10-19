import type { NodeishFilesystem } from "@lix-js/fs"

export const doesPathExist = async (fs: Pick<NodeishFilesystem, "stat">, path: string) =>
	!!(await fs.stat(path).catch(() => false))
