type ReadFileOptions = { encoding?: BufferEncoding; flag?: string } | BufferEncoding

/**
 * Minimal filesystem required by inlang
 */
export type FS = {
	readFile: (path: string, options?: ReadFileOptions) => Promise<string | Buffer>
	writeFile: (path: string, data: string) => Promise<void>
	readdir: (path: string) => Promise<Array<string | object>>
	mkdir: (path: string, options?: { recursive: boolean }) => Promise<void>
}
