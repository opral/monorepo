export const isAbsolutePath = (path: string) => {
	const matchPosixAndWindowsAbsolutePaths =
		/^(?:[A-Za-z]:\\(?:[^\\]+\\)*[^\\]+|[A-Za-z]:\/(?:[^/]+\/)*[^/]+|\/(?:[^/]+\/)*[^/]+)$/
	return matchPosixAndWindowsAbsolutePaths.test(path)
}
