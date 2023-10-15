import { decodeBuffer, encodePkLine } from "../isomorphic-git-forks/git-fetch-request-helpers.js";

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

function overrideWants(lines: string[], oids: string[]) {
	// flush line is the only line with an empty string 
	const newLines = [];
	let wantsCount = 0;

	let lastLineWasWants = false;
	
	// override existing haves
	for (const line of lines) {
		if (line.startsWith('want ')) {
			lastLineWasWants = true;
			if (oids.length > wantsCount) {
				newLines.push(line.substring(0, 'want '.length) + oids[wantsCount] + line.substring('want '.length + oids[wantsCount]?.length));
			}
			wantsCount += 1;
		}

		if (!line.startsWith('want ')) {
			if (lastLineWasWants && oids.length > wantsCount) {
				while (oids.length > wantsCount) {
					newLines.push('want ' + oids[wantsCount] + '\n');
					wantsCount += 1;
				}
				lastLineWasWants = false;
			} 
			newLines.push(line);
		}
			
	}

	return newLines;
}

function addWantsCapabilities(lines: string[]) {
	let capabilitiesAdded = false;
	const updatedLines = [];
	for (let line of lines) {
		if (line.startsWith('want') && !capabilitiesAdded) { //  5dec81f47085ae328439d5d9e5012143aeb8fef0
			line = line.substring(0, line.length - 1) + ' allow-tip-sha1-in-want allow-reachable-sha1-in-want no-progress\n';
			line =line.replace('ofs-delta', '')
			capabilitiesAdded = true;
			// getting an object directly doesn't work :-/ line = 'want 5dec81f47085ae328439d5d9e5012143aeb8fef0 multi_ack_detailed no-done side-band-64k ofs-delta agent=git/isomorphic-git@1.24.5\n'

		}
		updatedLines.push(line);
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
				|| line.startsWith('deepen-not') 
				|| line === flushLine)) {

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

export const httpWithLazyInjection = (http: any, config: { noneBlobFilter: boolean, overrideHaves: string[] | undefined, overrideWants: string[] | undefined}) => {
	
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

							if (config.overrideWants) {
								rawLines = addWantsCapabilities(rawLines);
								rawLines = overrideWants(rawLines, config.overrideWants)
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
