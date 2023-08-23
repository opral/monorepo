import type { NodeishFilesystem } from '@inlang-git/fs'

export const doesPathExist = async (fs: Pick<NodeishFilesystem, 'stat'>, path: string) => !!(await fs.stat(path).catch(() => false))
