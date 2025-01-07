import { expect, test, vi } from "vitest";
import { capture } from "./capture.js";

test("it should not capture if telemetry is off", async () => {
	global.fetch = vi.fn(() => Promise.resolve(new Response()));

	vi.mock("../env-variables/index.js", async () => {
		return {
			ENV_VARIABLES: {
				LIX_SDK_POSTHOG_TOKEN: "mock-defined",
			},
		};
	});

	await capture("LIX-SDK lix opened", {
		lixId: "test",
		accountId: "test",
		telemetryKeyValue: "off",
		properties: {},
	});

	expect(global.fetch).not.toHaveBeenCalled();
});

test("it should not capture if telemetry is NOT off", async () => {
	global.fetch = vi.fn(() => Promise.resolve(new Response()));

	vi.mock("../env-variables/index.js", async () => {
		return {
			ENV_VARIABLES: {
				LIX_SDK_POSTHOG_TOKEN: "mock-defined",
			},
		};
	});

	await capture("LIX-SDK lix opened", {
		lixId: "test",
		accountId: "test",
		telemetryKeyValue: "on",
		properties: {},
	});

	expect(global.fetch).toHaveBeenCalled();
});
