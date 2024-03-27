import { _FileSystem, _assertParameter, _join } from "../../vendored/isomorphic-git/index.js"
import { _checkout } from "./_checkout.js"

/**
 * Checkout a branch
 *
 * If the branch already exists it will check out that branch. Otherwise, it will create a new remote tracking branch set to track the remote branch of that name.
 *
 * @param {object} args
 * @param {import("../../vendored/isomorphic-git/index.js").FsClient} args.fs - a file system implementation
 * @param {import('../../vendored/isomorphic-git/index.js').ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} [args.ref = 'HEAD'] - Source to checkout files from
 * @param {string[]} [args.filepaths] - Limit the checkout to the given files and directories
 * @param {string} [args.remote = 'origin'] - Which remote repository to use
 * @param {boolean} [args.noCheckout = false] - If true, will update HEAD but won't update the working directory
 * @param {boolean} [args.noUpdateHead] - If true, will update the working directory but won't update HEAD. Defaults to `false` when `ref` is provided, and `true` if `ref` is not provided.
 * @param {boolean} [args.dryRun = false] - If true, simulates a checkout so you can test whether it would succeed.
 * @param {boolean} [args.force = false] - If true, conflicts will be ignored and files will be overwritten regardless of local changes.
 * @param {boolean} [args.track = true] - If false, will not set the remote branch tracking information. Defaults to true.
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<void>} Resolves successfully when filesystem operations are complete
 *
 * @example
 * // switch to the main branch
 * await git.checkout({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'main'
 * })
 * console.log('done')
 *
 * @example
 * // restore the 'docs' and 'src/docs' folders to the way they were, overwriting any changes
 * await git.checkout({
 *   fs,
 *   dir: '/tutorial',
 *   force: true,
 *   filepaths: ['docs', 'src/docs']
 * })
 * console.log('done')
 *
 * @example
 * // restore the 'docs' and 'src/docs' folders to the way they are in the 'develop' branch, overwriting any changes
 * await git.checkout({
 *   fs,
 *   dir: '/tutorial',
 *   ref: 'develop',
 *   noUpdateHead: true,
 *   force: true,
 *   filepaths: ['docs', 'src/docs']
 * })
 * console.log('done')
 */
export async function checkout({
	fs,
	onProgress,
	dir,
	gitdir = _join(dir, ".git"),
	remote = "origin",
	ref: _ref,
	filepaths,
	noCheckout = false,
	noUpdateHead = _ref === undefined,
	dryRun = false,
	force = false,
	track = true,
	cache = {},
}) {
	try {
		_assertParameter("fs", fs)
		_assertParameter("dir", dir)
		_assertParameter("gitdir", gitdir)

		const ref = _ref || "HEAD"
		return await _checkout({
			fs: new _FileSystem(fs),
			cache,
			onProgress,
			dir,
			gitdir,
			remote,
			ref,
			filepaths,
			noCheckout,
			noUpdateHead,
			dryRun,
			force,
			track,
		})
	} catch (err) {
		// @ts-ignore
		err.caller = "git.checkout"
		throw err
	}
}
