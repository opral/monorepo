/**
 * Importing ES modules either from a local path, or from a url.
 *
 * The imported module must be ESM. A good indicator is whether
 * the "type" property in a package.json is set to "module" if
 * node is used.
 *
 * _[See test cases](./$import.test.js)_
 */
// Some environments do not support the import of modules from a url.
export async function $import(uri: string): Promise<any> {
	if (uri.startsWith("http")) {
		const moduleText = await (await fetch(uri)).text();
		const withMimeType =
			"data:application/javascript;base64," + btoa(moduleText);
		return await import(withMimeType);
	} else {
		return await import(uri);
	}
}
