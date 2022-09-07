/**
 * Subset of Node's promise based FS that can run in the browser.
 *
 * The subset is mainly defined by [ismorphic-git/lightning-fs](https://github.com/isomorphic-git/lightning-fs).
 * The types can be found here https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/isomorphic-git__lightning-fs/index.d.ts
 */
export type FsPromisesSubset = {
	writeFile(
		filepath: string,
		data: Uint8Array | string,
		options?: WriteFileOptions | string
	): Promise<void>;
	readFile(
		filepath: string,
		options?: ReadFileOptions | string
	): Promise<Uint8Array | string>;
};

interface WriteFileOptions {
	/**
	 * Posix mode permissions
	 * @default 0o777
	 */
	mode: number;
	encoding?: "utf8";
}
interface ReadFileOptions {
	encoding?: "utf8";
}
