import { AsyncLocalStorage } from "async_hooks";
import { createParaglide } from "../create-paraglide.js";
import { newProject } from "@inlang/sdk";
import { test, expect } from "vitest";

test("tracks message calls", async () => {
	const runtime = await createParaglide({
		project: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});

	const mockMessage = (str: string) => {
		runtime.trackMessageCall(str, "de");
	};

	runtime.overwriteServerAsyncLocalStorage(new AsyncLocalStorage());

	const messageCalls = new Set<string>();

	const result = runtime.serverAsyncLocalStorage?.run({ messageCalls }, () => {
		mockMessage("test1");
		mockMessage("test2");
		return "test3";
	});

	expect(result).toBe("test3");
	expect(messageCalls).toEqual(new Set(["test1:de", "test2:de"]));
});
