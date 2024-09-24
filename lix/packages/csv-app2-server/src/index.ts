import { serve } from "@hono/node-server";
import { openLixInMemory, merge } from "@lix-js/sdk";
import { Hono } from "hono";
import { plugin } from "./csv-plugin.js";

export const app = new Hono();
const lixFiles = new Map<string, Blob>();

// A Map to track locks for each ID to ensure synchronization
const locks = new Map<string, Promise<Response>>();

// Function to handle locking per ID
async function synchronized(id: string, fn: () => Promise<Response>) {
	const previous = locks.get(id) || Promise.resolve();
	const current = previous.then(fn).finally(() => {
		// Once done, remove the lock for the ID
		if (locks.get(id) === current) {
			locks.delete(id);
		}
	});
	locks.set(id, current);
	return current;
}

app.post("/lix-file/:id", async (c) => {
	const { id } = c.req.param();

	// Get the binary data from the request body
	const buffer = await c.req.arrayBuffer();
	const clientBlob = new Uint8Array(buffer);

	const serverStateBlob = lixFiles.get(id);

	return synchronized(id, async () => {
		if (!serverStateBlob) {
			const serverLix = await openLixInMemory({
				blob: new Blob([clientBlob]),
				providePlugins: [plugin],
			});

			lixFiles.set(id, await serverLix.toBlob());
			// Return the new binary data
			return c.body(await lixFiles.get(id)!.arrayBuffer(), 200, {
				"Content-Type": "application/octet-stream",
			});
		}

		const clientLix = await openLixInMemory({
			blob: new Blob([clientBlob]),
			providePlugins: [plugin],
		});

		const serverLix = await openLixInMemory({
			blob: serverStateBlob,
			providePlugins: [plugin],
		});

		// console.log(clientLix.db.selectFrom())

		await merge({ sourceLix: clientLix, targetLix: serverLix });
		lixFiles.set(id, await serverLix.toBlob());
		// Return the new binary data
		return c.body(await lixFiles.get(id)!.arrayBuffer(), 200, {
			"Content-Type": "application/octet-stream",
		});
	});
});

app.get("/lix-file/:id", async (c) => {
	const { id } = c.req.param();

	if (!lixFiles.get(id)) {
		return c.text("no lix file found", 400);
	}

	return c.body(await lixFiles.get(id)!.arrayBuffer(), 200, {
		"Content-Type": "application/octet-stream",
	});
});

const port = 3000;

serve({
	fetch: app.fetch,
	port,
});
