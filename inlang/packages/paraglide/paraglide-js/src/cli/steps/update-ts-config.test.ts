import { expect, test, vi } from "vitest";
import { memfs } from "memfs";
import { maybeUpdateTsConfigAllowJs } from "./update-ts-config.js";
import { Logger } from "../../services/logger/index.js";

const setCwd = (cwd: string) => {
	const original = process.cwd;
	process.cwd = (() => cwd) as typeof process.cwd;
	return () => {
		process.cwd = original;
	};
};

// Regression coverage for https://github.com/opral/inlang-paraglide-js/issues/560
test("skips prompting when allowJs is set in a referenced tsconfig", async () => {
	const fs = memfs({
		"/tsconfig.json": JSON.stringify({
			references: [{ path: "./tsconfig.app.json" }],
		}),
		"/tsconfig.app.json": JSON.stringify({
			compilerOptions: { allowJs: true },
		}),
	}).fs as unknown as typeof import("node:fs");

	const restoreCwd = setCwd("/");
	const logger = new Logger({ silent: true, prefix: false });
	const infoSpy = vi.spyOn(logger, "info");

	try {
		await maybeUpdateTsConfigAllowJs({
			fs: fs.promises,
			logger,
		});

		expect(infoSpy).not.toHaveBeenCalled();
	} finally {
		restoreCwd();
	}
});

// Regression coverage for https://github.com/opral/inlang-paraglide-js/issues/560
test("skips prompting when allowJs is provided via extends", async () => {
	const fs = memfs({
		"/tsconfig.json": JSON.stringify({
			extends: "./tsconfig.base.json",
		}),
		"/tsconfig.base.json": JSON.stringify({
			compilerOptions: { allowJs: true },
		}),
	}).fs as unknown as typeof import("node:fs");

	const restoreCwd = setCwd("/");
	const logger = new Logger({ silent: true, prefix: false });
	const infoSpy = vi.spyOn(logger, "info");

	try {
		await maybeUpdateTsConfigAllowJs({
			fs: fs.promises,
			logger,
		});

		expect(infoSpy).not.toHaveBeenCalled();
	} finally {
		restoreCwd();
	}
});
