export type FileData = string | Uint8Array

export interface FilesystemError extends Error {
	code: string
	path: string
}

export interface Filesystem {
	dirname: (path: string) => Promise<string>
	basename: (path: string) => Promise<string>
	writeFile: (path: string, content: FileData) => Promise<void>
	readFile: (path: string) => Promise<FileData>
	readdir: (path: string) => Promise<string[]>
	mkdir: (path: string) => Promise<void>
	rm: (path: string) => Promise<void>
	/**
	 * Serializes the filesystem to a JSON string.
	 *
	 * @example
	 *   const result = fs.toJson()
	 *   >> { "file1.txt": "content", "file2.txt": "content" }
	 */
	toJson: (args?: {
		/**
		 * Takes a list of glob patterns to include.
		 *
		 * @example
		 *   fs.toJson({ include: ["**\/*.json", "**\/*.md"] })
		 */
		include?: string[]
		/**
		 * Takes a list of glob patterns to exclude.
		 *
		 * @example
		 *   fs.toJson({ exclude: ["**\/node_modules"] })
		 */
		exclude?: string[]
		/**
		 * The directory to convert to JSON. Default is fs root (memory) or cwd (node)
		 *
		 * @example
		 *   fs.toJson({ dir: "/home/user/project" })
		 */
		dir?: string
	}) => Promise<Record<string, any>>
	fromJson: (json: Record<string, string>) => Promise<Filesystem>
}

export interface NodeishFilesystem {
	writeFile: (path: string, content: string) => Promise<void>
	readFile: (
		path: string,
		options?: { encoding?: BufferEncoding } | BufferEncoding,
	) => Promise<string | Buffer>
	readdir: (path: string) => Promise<string[]>
	mkdir: (path: string, options?: any) => Promise<void>
	rm: (path: string, options?: any) => Promise<void>
	rmdir: (path: string, options?: any) => Promise<void>
}
