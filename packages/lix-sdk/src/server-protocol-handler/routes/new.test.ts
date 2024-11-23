import { test, expect } from "vitest";
import { createLspHandler } from "../create-lsp-handler.js";
import { createLspHandlerMemoryStorage } from "../storage/create-memory-storage.js";
import { newLixFile } from "../../lix/new-lix.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";

test("it should store the lix file in storage", async () => {
	const lixFile = await newLixFile();

	const storage = createLspHandlerMemoryStorage();
	const lsp = await createLspHandler({ storage });

	const response = await lsp(
		new Request("http://localhost:3000/lsp/new", {
			method: "POST",
			body: lixFile,
		}),
	);

	const blob = await storage.get("new");
	const lix = await openLixInMemory({ blob });

	expect(response.status).toBe(200);
	expect(lix).toBeDefined();
});
