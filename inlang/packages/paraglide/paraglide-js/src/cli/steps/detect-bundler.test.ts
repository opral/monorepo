import { expect, test } from "vitest";
import { memfs } from "memfs";
import { describe } from "node:test";
import { detectBundler } from "./detect-bundler.js";

describe("vite", async () => {
	test("detects vite.config.js ", async () => {
		const fs = memfs({
			"/vite.config.js": "mock",
		}).fs as unknown as typeof import("node:fs");

		process.cwd = () => "/";

		const result = await detectBundler({
			fs: fs.promises,
		});

		expect(result.bundler).toBe("vite");
		expect(result.configPath).toBe("./vite.config.js");
	});

	test("detects vite.config.ts ", async () => {
		const fs = memfs({
			"/vite.config.ts": "mock",
		}).fs as unknown as typeof import("node:fs");

		process.cwd = () => "/";

		const result = await detectBundler({
			fs: fs.promises,
		});

		expect(result.bundler).toBe("vite");
		expect(result.configPath).toBe("./vite.config.ts");
	});
});
