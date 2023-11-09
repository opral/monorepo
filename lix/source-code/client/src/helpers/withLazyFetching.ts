import type { NodeishFilesystem } from '@lix-js/fs';
import { checkout, listFiles } from 'isomorphic-git';

import { blobExistsLocaly } from "./blobExistsLocaly.js"
import { fetchBlobsFromRemoteThrottled } from "./fetchBlobsFromRemoteThrottled.js"
// import { fetchBlobsFromRemote } from "./fetchBlobsFromRemote.js"
// eslint-disable-next-line unicorn/prefer-node-protocol -- TODO #1459 we explicitly want to use path to use browserfy-path here
import path from "path"

/**
 * Wraps a nodeishFs implementation with a js proxy for detailed logging, debugging and transparently replacing the file access behaviour.
 * advantage of using this approach is that the underlying fs can also be swapped to something like lightingfs seamlessly.
 */
export const withLazyFetching = (
	fs: NodeishFilesystem,
	dir: string,
	gitdir: string,
	ref: string,
	filePathToOid: any,
	oidToFilePaths: any,
	http: any,
	_module: string
): NodeishFilesystem => {
	// - when a read of an object is detected (the first time - this needs to be stored in memory to avoid double fetch) call fatch with all files oids of the repo but the oid of the current file
	// - this will be triggered with in the checkout on _readObject -> readObjectLoose calls and allows us to lazy fetch the file
	async function lazyLoadingInterceptor({
		prop,
		argumentsList,
		execute,
	}: {
		prop: string | symbol
		argumentsList: any[]
		execute: () => any
	}) {
		if (prop !== "readFile" || argumentsList.length === 0) {
			// forawrd all non readFiles
			// TODO #1459 while this works with the subset of fs calls of the editor i evaluated (writes follow reads, it doesn't seem to read folders, ...) this is not great yet
			// we should support all actions lazily:
			// - readFolder should return the list of all files
			// - writeFile should see if the file exists in git first and override on an indexed file
			// - lstat ...
			// - mkdir ...
			// - rm should check if the file exists in the git index and drop it (is a fetch acually needed?)
			// - rmdir should only work on empty dirs in js right?
			return execute()
		}

		// ok we are in the readfile - check if we deal with an object
		const filePath = argumentsList[0]
		let gitFilePath = filePath
		if (dir !== undefined) {
			const dirWithLeadingSlash = dir.endsWith("/") ? dir : dir + "/"
			if (!filePath.startsWith(dirWithLeadingSlash)) {
				throw new Error(
					"Filepath " +
						filePath +
						" did not start with repo root dir " +
						dir +
						" living in git repo?"
				)
			}
			gitFilePath = filePath.slice(dirWithLeadingSlash.length)
		}

		const { dir: filePathDir, base } = path.parse(gitFilePath)
		const folders = filePathDir.split(path.sep)

		if (!gitFilePath.includes(".git")) {
			// TODO #1459  more solid check for git folder !filePath.startsWith(gitdir)) {
			// al right - we have a "normal" file not a .git file
			// first of all we check if it exists - if so just return it - don't manipulate the index here
			try {
				await fs.stat(filePath)
				return execute()
			} catch (e) {
				// TODO #1459 filter only file does not exists exception and throw others instead of continuing here...
			}

			// TODO #1459 this list is currently injected on creation of the proxy - this means it is not reactive to changes. I guess we should check this on the fly and walk the index every time?
			const fileOid = filePathToOid[gitFilePath]

			// if it doesn't exist - check if it is in the git tree, add it to the managed files and do a checkout for this particular file
			if (fileOid !== undefined) {
				// check if the file is on the index already (this means it was deleted eventually...)
				const filesOnIndex = await listFiles({
					fs: fs,
					gitdir: gitdir,
					// TODO #1459 investigate the index cache further seem to be an in memory forwared on write cache to allow fast reads of the index...
					dir: dir,
					// NOTE: no ref config! we don't set ref because we want the list of files on the index
				})

				if (filesOnIndex.includes(fileOid)) {
					execute()
				} else {
					const fileExistsLocally = await blobExistsLocaly(fs, fileOid, gitdir)
					if (!fileExistsLocally) {
						await fetchBlobsFromRemoteThrottled({
							fs: fs,
							gitdir: gitdir,
							http: http,
							ref,
							oids: [fileOid],
						})
					}

					await checkout({
						dir: dir,
						gitdir: gitdir,
						fs: fs,
						filepaths: [gitFilePath],
						ref: ref,
					})

					return execute()
				}
			} else {
				// file not part of the repo
				return execute()
			}
		}

		// we have a readFile in the .git folder - we only intercet readings on the blob files
		// git checkout (called after a file was requested that doesn't exist on the client yet)
		// 1. tries to read the loose object with its oid as identifier  (see: https://github.com/isomorphic-git/isomorphic-git/blob/9f9ebf275520244e96c5b47df0bd5a88c514b8d2/src/storage/readObject.js#L37)
		// 2. tries to find the blob in one of the downloaded pack files (see: https://github.com/isomorphic-git/isomorphic-git/blob/9f9ebf275520244e96c5b47df0bd5a88c514b8d2/src/storage/readObject.js#L37)
		// if both don't exist it fill fail
		// we intercept read of loose objects in 1. to check if the object exists loose or packed using blobExistsLocaly()
		// if we know it doesn't exist - and also 2. would fail - we fetch the blob from remote - this will add it as a pack file and 2. will succeed

		// To detect a read of a blob file we can check the path if it is an blob request and which one
		// -1-- ---2--- -3 ---------------4----------------------
		// .git/objects/5d/ec81f47085ae328439d5d9e5012143aeb8fef0
		// 1. git folder
		// 2. loose objects folder
		// 3. first two letters of the oid
		// 4. rest of the oid letters
		if (
			folders.length < 3 || // TODO #1459 this only works with .git in the root folder
			// || folders[folders.length-3] // TODO #1459 check if we are in the git folder
			folders.at(-2) !== "objects" || // check if we are in objects folcer
			folders.at(-1)?.length !== 2
		) {
			// forward non loose object requests
			return execute()
		}

		// extract the oid from the path and check if we can resolve the object loacly alread
		const firstTwoCharsOfHash = folders.at(-1)
		const oid = firstTwoCharsOfHash + base

		// check if file exists directly
		const existsLocaly = await blobExistsLocaly(
			fs, // we use the raw fs since we don't want to endup in the delayed function
			oid,
			gitdir
		)

		// Ok it exists - just let the original call continue
		if (existsLocaly) {
			return execute()
		}

		// oh it doesn't exist - fetch its pack file so the later lookup succeeds
		await fetchBlobsFromRemoteThrottled({
			fs: fs,
			gitdir,
			http: http,
			ref,
			oids: [oid],
		})

		return execute()
	}

	return new Proxy(fs, {
		get(getTarget: typeof fs, prop, receiver) {
			if (getTarget[prop as keyof typeof fs]) {
				return new Proxy(getTarget[prop as keyof typeof getTarget], {
					apply(callTarget, thisArg, argumentsList) {
						const execute = () => Reflect.apply(callTarget, thisArg, argumentsList)

						return lazyLoadingInterceptor({ prop, argumentsList, execute })
					},
				})
			}

			return Reflect.get(getTarget, prop, receiver)
		},
	})
}
