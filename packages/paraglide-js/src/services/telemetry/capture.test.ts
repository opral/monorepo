import { expect, test, vi } from "vitest";
import { capture } from "./capture.js";

test("it should not capture if telemetry is off", async () => {
	// @ts-expect-error - global.fetch is not defined
	global.fetch = vi.fn(() => Promise.resolve());

	vi.mock("../env-variables/index.js", async () => {
		return {
			ENV_VARIABLES: {
				PARJS_POSTHOG_TOKEN: "mock-defined",
			},
		};
	});

	await capture("PARAGLIDE-JS compile executed", {
		projectId: "test",
		settings: {
			telemetry: "off",
		},
		properties: {},
	});

	expect(global.fetch).not.toHaveBeenCalled();
});

test("it should not capture if telemetry is NOT off", async () => {
	// @ts-expect-error - global.fetch is not defined
	global.fetch = vi.fn(() => Promise.resolve());

	vi.mock("../env-variables/index.js", async () => {
		return {
			ENV_VARIABLES: {
				PARJS_POSTHOG_TOKEN: "mock-defined",
			},
		};
	});

	await capture("PARAGLIDE-JS compile executed", {
		projectId: "test",
		settings: {
			telemetry: undefined,
		},
		properties: {},
	});

	expect(global.fetch).toHaveBeenCalled();
});
