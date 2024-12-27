import type { Lix } from "@lix-js/sdk";

function escape(url: string) {
	const bytes = new TextEncoder().encode(url);

	// 64-bit FNV1a hash to make the file-names shorter
	// https://en.wikipedia.org/wiki/FNV-1a
	const hash = bytes.reduce(
		(hash, byte) =>
			BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1_099_511_628_211n),
		14_695_981_039_346_656_037n
	);

	return hash.toString(36);
}

async function readModuleFromCache(
	moduleURI: string,
	lix: Lix
): Promise<string | undefined> {
	const moduleHash = escape(moduleURI);
	const filePath = `/cache/plugins/${moduleHash}`;

	const file = await lix.db
		.selectFrom("file")
		.where("path", "=", filePath)
		.selectAll()
		.executeTakeFirst();

	if (file) {
		return new TextDecoder().decode(file.data);
	}
	return undefined;
}

async function writeModuleToCache(
	moduleURI: string,
	moduleContent: string,
	lix: Lix
): Promise<void> {
	const moduleHash = escape(moduleURI);
	const filePath = `/cache/plugins/${moduleHash}`;

	await lix.db
		.insertInto("file")
		.values({
			path: filePath,
			data: new TextEncoder().encode(moduleContent),
		})
		// update the cache
		.onConflict((oc) =>
			oc.doUpdateSet({ data: new TextEncoder().encode(moduleContent) })
		)
		.execute();
}

/**
 * Implements a "Network-First" caching strategy.
 */
export function withCache(
	moduleLoader: (uri: string) => Promise<string>,
	lix: Lix
): (uri: string) => Promise<string> {
	return async (uri: string) => {
		try {
			const moduleAsText = await moduleLoader(uri);
			await writeModuleToCache(uri, moduleAsText, lix);
			return moduleAsText;
		} catch (e) {
			// network fetch failed, try to read from cache
			const cacheResult = await readModuleFromCache(uri, lix);
			if (cacheResult) {
				return cacheResult;
			} else {
				throw e;
			}
		}
	};
}
