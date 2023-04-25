/**
 * Serializes the filesystem to a JSON that can be sent over the network.
 *
 * @example
 *   const result = fs.toJson()
 *   >> { "file1.txt": "content", "file2.txt": "content" }
 *
 */
export async function toJson(args: {
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
}): Promise<Record<string, any>> {
	console.log(args)
	throw new Error("Not implemented")
}
