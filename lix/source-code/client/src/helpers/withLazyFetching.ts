import type { NodeishFilesystem } from '@lix-js/fs';
import { checkout, listFiles } from 'isomorphic-git';
import path from 'path';
import { blobExistsLocaly } from './blobExistsLocaly.js';
import { fetchBlobsFromRemoteThrottled } from './fetchBlobsFromRemoteThrottled.js';

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
	_module: string,
): NodeishFilesystem => {

	// - when a read of an object is detected (the first time - this needs to be stored in memory to avoid double fetch) call fatch with all files oids of the repo but the oid of the current file
	// - this will be triggered with in the checkout on _readObject -> readObjectLoose calls and allows us to lazy fetch the file
	async function lazyLoadingInterceptor({ prop, argumentsList, execute, }: { prop: string | symbol, argumentsList: any[], execute: () => any }) {
		
		if (prop !== 'readFile' || argumentsList.length === 0) {
			// forawrd all non readFiles
			return execute();
		}

		// ok we are in the readfile - check if we deal with an object
		const filePath = argumentsList[0];
		let gitFilePath = filePath;
		if (dir !== undefined) {
			const dirWithLeadingSlash = dir.endsWith('/') ? dir : dir + '/';
			if (!filePath.startsWith(dirWithLeadingSlash)) {
				throw new Error('Filepath ' + filePath + ' did not start with repo root dir '+dir + ' living in git repo?');
			}
			gitFilePath = filePath.substring(dirWithLeadingSlash.length);
		}

		
		const { dir: filePathDir, base } = path.parse(gitFilePath);
		const folders = filePathDir.split(path.sep);

		if (!gitFilePath.includes('.git')) { // TODO more solid check for git folder !filePath.startsWith(gitdir)) {
			// al right - we have a "normal" file not a .git file
			// first of all we check if it exists - if so just return it - don't manipulate the index here
			try {
				await fs.stat(filePath);
				return execute();
			} catch (e) {
				// TODO check other exceptions than file does not exists
			}

			const fileOid = filePathToOid[gitFilePath];

			// if it doesn't exist - check if it is in the git tree, add it to the managed files and do a checkout for this particular file
			if (fileOid !== undefined) {
				// check if the file is on the index already (this means it was deleted eventually...)
				const filesOnIndex = await listFiles({
					fs: fs,
					gitdir: gitdir,
					// cache
					dir: dir,
					// ref - we don't set ref because we want the list of files on the index
				});

				if (filesOnIndex.includes(fileOid)) {
					execute();
				} else {
					const fileExistsLocally = await blobExistsLocaly(fs, fileOid, gitdir);
					if (!fileExistsLocally) {
						await fetchBlobsFromRemoteThrottled({
							fs: fs,
							gitdir: gitdir,
							http: http, 
							oids: [fileOid],
							allOids: Object.keys(oidToFilePaths)
						})
					}
					// const wrappedFs = withLazyFetching(rawFs as unknown as NodeishFilesystem, 'test', cb);

					console.log('\nRepo Checkout');
					await checkout(
						{
							dir: dir,
							gitdir: gitdir,
							fs: fs,
							filepaths: [gitFilePath],
							ref: ref,
						}
					)
					return execute();
				}
			} 
		}

		// .git/objects/as/asdasdasffasfasdasdasd
		if (folders.length < 3 // TODO also check 
			// || folders[folders.length-3] // TODO check if we are in the git folder
			|| folders[folders.length-2] !== 'objects' // check if we are in objects folcer
			|| folders[folders.length-1]?.length !== 2 
			) {
			// forward non objects
			return execute();
		}

		// check if file exists directly
		
		// exxtract the oid from the path and check if we can resolve the object loacly alread
		const firstTwoCharsOfHash = folders[folders.length-1];
		const oid = firstTwoCharsOfHash + base;


		// if we have an oid request we are comming from _readObject of checkout
		// checkout->_readObject internally 
		// 1. tries to resolve the oid using objects (the call we intercept here)
		// 2. tries to find it in a pack file 

		const existsLocaly = await blobExistsLocaly(
			fs, // we use the raw fs since we don't want to endup in the delayed function
			oid, 
			gitdir);

		// this intercepts 1., checks if the object file or the pack file exists and loads them using fetch by passing all other files as have

		if (existsLocaly) {
			return execute();
		}

		console.log('trying to find hash: ' + oid + ' (files: ' + oidToFilePaths[oid]?.join() + ') locally - not found - fetching it' );
		await fetchBlobsFromRemoteThrottled({
			fs: fs,
			gitdir,
			http: http,
			oids: [oid],
			allOids: Object.keys(oidToFilePaths)
		});
		
		console.log('done');


		return execute();	
	}

	return new Proxy(fs, {
		get(getTarget: typeof fs, prop, receiver) {
			if (getTarget[prop as keyof typeof fs]) {
				return new Proxy(getTarget[prop as keyof typeof getTarget], {
					apply(callTarget, thisArg, argumentsList) {
						// console.log(`${_module} fs:`, prop, argumentsList)
						
						
						const execute = () => Reflect.apply(callTarget, thisArg, argumentsList);

						return lazyLoadingInterceptor({ prop, argumentsList, execute })
							
					},
				})
			}

			return Reflect.get(getTarget, prop, receiver)
		},
	})
}
