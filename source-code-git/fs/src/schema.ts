export interface FsError extends Error {
	code: string
}

export interface Filesystem {
	writeFile: (path: string, content: string) => Promise<void>
	readFile: (path: string, encoding?: string) => Promise<string>
	readdir: (path: string) => Promise<string[]>
	mkdir: (path: string, options?: any) => Promise<void>
	rmdir: (path: string, options?: any) => Promise<void>
	rm: (path: string, options?: any) => Promise<void>
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
