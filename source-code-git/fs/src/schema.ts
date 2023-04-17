export interface Filesystem {
	writeFile: (path: string, content: string) => Promise<void>
	readFile: (path: string) => Promise<string | undefined>
	readdir: (path: string) => Promise<string[] | undefined>
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
	}) => Promise<Record<string, any>>
	fromJson: (json: Record<string, string>) => Promise<Filesystem>
}
