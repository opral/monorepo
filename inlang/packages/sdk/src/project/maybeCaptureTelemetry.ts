import { Kysely } from "kysely";
import { capture } from "../services/telemetry/capture.js";
import type { InlangDatabaseSchema } from "../database/schema.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { Lix } from "@lix-js/sdk";

export async function maybeCaptureLoadedProject(args: {
	id: string;
	lix: Lix;
	settings: ProjectSettings;
	plugins: Readonly<Array<{ key: string }>>;
	appId?: string;
	db: Kysely<InlangDatabaseSchema>;
	forceCapture?: boolean;
}) {
	if (args.settings.telemetry === "off") {
		return;
	}

	// --- SAMPLING ---
	// randomly sample 10% of projects
	// to reduce the number of telemetry events.
	//
	// 10% is chosen out of a gut feeling
	if (args.forceCapture !== true && Math.random() > 0.1) {
		return;
	}

	try {
		const activeAccount = await args.lix.db
			.selectFrom("active_account")
			.select("account_id")
			.executeTakeFirstOrThrow();

		const bundles = await args.db
			.selectFrom("bundle")
			.select((s) => s.fn.count("id").as("count"))
			.executeTakeFirst();
		const messages = await args.db
			.selectFrom("message")
			.select((s) => s.fn.count("id").as("count"))
			.executeTakeFirst();
		const variants = await args.db
			.selectFrom("variant")
			.select((s) => s.fn.count("id").as("count"))
			.executeTakeFirst();

		await capture("SDK loaded project", {
			projectId: args.id,
			settings: args.settings,
			accountId: activeAccount.account_id,
			properties: {
				// Insight: Which app is used by the SDK
				appId: args.appId,
				// Insight: How many languages are used, etc.
				settings: args.settings,
				// Insight on the used plugins (which one's to prioritize)
				pluginKeys: args.plugins.map((plugin) => plugin.key),
				// Insight: Which version of the SDK is used (can be used to deprecate old versions)
				sdkVersion: ENV_VARIABLES.SDK_VERSION,
				// Insight: Scale of projects (what project size to optimize for)
				numBundles: bundles?.count,
				numMessages: messages?.count,
				numVariants: variants?.count,
			},
		});
	} catch (e) {
		if (
			e instanceof Error &&
			e.message.includes("driver has already been destroyed")
		) {
			// The project has been closed, nothing to capture
			return;
		}
	}
}
