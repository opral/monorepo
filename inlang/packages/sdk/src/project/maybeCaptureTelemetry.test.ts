import { expect, test, vi } from "vitest";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { newProject } from "./newProject.js";
import { maybeCaptureLoadedProject } from "./maybeCaptureTelemetry.js";
import { capture } from "../services/telemetry/capture.js";
import { humanId, uuidV7 } from "@lix-js/sdk";

// telemetry is disabled
test.skip("it should capture as expected", async () => {
	vi.mock("../services/telemetry/capture.js", async () => {
		return {
			capture: vi.fn(() => Promise.resolve()),
		};
	});

	vi.mock("../services/env-variables/index", async () => {
		return {
			ENV_VARIABLES: {
				PUBLIC_POSTHOG_TOKEN: "mock-defined",
				SDK_VERSION: "1.0.0-mock",
			},
		};
	});

	const project = await loadProjectInMemory({
		blob: await newProject(),
	});

	const account = await project.lix.db
		.selectFrom("active_account")
		.select("account_id")
		.executeTakeFirstOrThrow();

	const bundleId = await humanId({ lix: project.lix });
	await project.db
		.insertInto("bundle")
		.values({ id: bundleId, declarations: [] })
		.execute();

	const messageId = await uuidV7({ lix: project.lix });
	await project.db
		.insertInto("message")
		.values({
			id: messageId,
			bundleId,
			locale: "en",
			selectors: [],
		})
		.execute();

	await project.db
		.insertInto("variant")
		.values({
			id: await uuidV7({ lix: project.lix }),
			messageId,
			matches: [],
			pattern: [],
		})
		.execute();

	const settings = await project.settings.get();

	const id = await project.id.get();

	const plugins = await project.plugins.get();

	await maybeCaptureLoadedProject({
		id,
		settings,
		forceCapture: true,
		plugins,
		lix: project.lix,
		appId: "test",
		db: project.db,
	});

	expect(capture).toHaveBeenCalledWith("SDK loaded project", {
		projectId: await project.id.get(),
		settings: await project.settings.get(),
		accountId: account.account_id,
		properties: {
			appId: "test",
			settings: await project.settings.get(),
			pluginKeys: [],
			sdkVersion: "1.0.0-mock",
			numBundles: 1,
			numMessages: 1,
			numVariants: 1,
		},
	});
});
