import type { NodeishFilesystem } from "@lix-js/fs"
import { decodeBuffer, encodePkLine } from "./isomorphic-git-forks/git-fetch-request-helpers.js"


/**
 * Transforms a remote URL to a standard format.
 */
export function transformRemote(remote: string) {
	// Match HTTPS pattern or SSH pattern
	const regex = /(?:https:\/\/|@|git:\/\/)([^/]+)\/(.+?)(?:\.git)?$/
	const matches = remote.match(regex)

	if (matches && matches[1] && matches[2]) {
		let host = matches[1].replace(/:/g, "/") // Replace colons with slashes in the host
		const repo = matches[2]

		// Remove ghp_ key if present in the host
		host = host.replace(/ghp_[\w]+@/, "")

		return `${host}/${repo}.git`
	}
	return "unknown" // Return unchanged if no match
}

export function parseLixUri(uriText: string) {
	const { protocol, host, pathname } = new URL(uriText)

	if (protocol === "file:") {
		throw new Error(`Local repos are not supported yet`)
	}

	const pathParts = pathname.split("/")

	let lixHost = ""
	let namespace = ""
	let repoHost = ""
	let owner = ""
	let repoName = ""

	if (host === "github.com") {
		repoHost = host
		owner = pathParts[1] || ""
		repoName = pathParts[2] || ""

		if (!repoHost || !owner || !repoName) {
			throw new Error(
				`Invalid url format for '${uriText}' for direct cloning repository from github, please use the format of https://github.com/inlang/monorepo.`
			)
		}
	} else {
		lixHost = host
		namespace = pathParts[1] || ""
		repoHost = pathParts[2] || ""
		owner = pathParts[3] || ""
		repoName = pathParts[4] || ""

		if (!namespace || !host || !owner || !repoName) {
			throw new Error(
				`Invalid url format for '${uriText}' for cloning repository, please use the format of https://lix.inlang.com/git/github.com/inlang/monorepo.`
			)
		}
	}

	return {
		protocol,
		lixHost,
		namespace,
		repoHost,
		owner,
		repoName,
	}
}

function overrideHaves(lines: string[], oids: string[]) {
	// flush line is the only line with an empty string 
	const linesWithoutHaves = [];
	const flushLine = '';
	
	// delete existing haves
	for (const line of lines) {
		if (!line.startsWith('have ')) {
			linesWithoutHaves.push(line);
		}
	}

	const updatedLines = [];
	for (const line of linesWithoutHaves) {
		updatedLines.push(line);
		if ( line === flushLine) {
			for (const oid of oids) {
				updatedLines.push('have '+oid+'\n');
			}
		}
	}
	return updatedLines;
}

function addBlobNoneFilter(lines: string[]) {
	// TODO find the first wants line - and append the filter capability
	// TODO add filter after last wants line
	let filterCapabilityAdded = false;
	let filterAdded = false;
	
	const updatedLines = [];
	const flushLine = '';

	for (let line of lines) {
		if (line.startsWith('want') && !filterCapabilityAdded) { //  5dec81f47085ae328439d5d9e5012143aeb8fef0
			line = line.substring(0, line.length - 1) + ' filter\n';
			filterCapabilityAdded = true;
			// getting an object directly doesn't work :-/ line = 'want 5dec81f47085ae328439d5d9e5012143aeb8fef0 multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5\n'

		}

		// insert the filter before the deepen since or the deepen not if both not exist before the flush...
		if (!filterAdded && 
			(line.startsWith('deepen-since') 
				|| line.startsWith('deepen-not') 
				|| line === flushLine)) {

			//updatedLines.push('filter sparse:path=README.md\n');        
					// 'ERR filter 'sparse:oid' not supported'
			 // updatedLines.push('filter sparse:oid=*.md\n');        
			// updatedLines.push('filter sparse:oid=5dec81f47085ae328439d5d9e5012143aeb8fef0\n');
			updatedLines.push('filter blob:none\n');
			// updatedLines.push('have 05425bb46feb6c5ff67dfe9d03f58d1f0d62579d\n');
			filterAdded = true;
		}

		updatedLines.push(line);

	}

	return updatedLines;
}

export const withLazyInjection = (http: any, config: { noneBlobFilter: boolean, overrideHaves: string[] | undefined}) => {
	
	return new Proxy(http, {
		get(getTarget: typeof http, prop, receiver) {
			if (prop === 'request' && getTarget[prop as keyof typeof http]) {
				return new Proxy(getTarget[prop as keyof typeof getTarget], {
					apply(callTarget, thisArg, argumentsList) {
						// console.log(`${_module} fs:`, prop, argumentsList)

						const options = argumentsList[0];

						if (options.body) {
         
							let rawLines = decodeBuffer(options.body);
							
							if (config.noneBlobFilter) {
								rawLines = addBlobNoneFilter(rawLines);
							}
					
							if (config.overrideHaves) {
								rawLines = overrideHaves(rawLines, config.overrideHaves)
							}

							// console.log(rawLines);
						
							options.body = rawLines.map((updatedRawLine) => encodePkLine(updatedRawLine));
						}
						
						
						return Reflect.apply(callTarget, thisArg, argumentsList);
					},
				})
			}

			return Reflect.get(http, prop, receiver)
		},
	})
}
