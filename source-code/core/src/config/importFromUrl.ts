export async function importFromUrl(url: string): Promise<any> {
	const moduleData = await (await fetch(url)).text();
	const b64moduleData = "data:text/javascript;base64," + btoa(moduleData);
	return await import(b64moduleData);
}
