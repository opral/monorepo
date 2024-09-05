import { Kysely } from "kysely";
import { capture } from "../services/telemetry/capture.js";
import { type ProjectState } from "./state/state.js";
import type { InlangDatabaseSchema } from "../database/schema.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";

export async function maybeCaptureLoadedProject(args: {
	state: ProjectState;
	applicationId?: string;
	applicationVersion?: string;
	db: Kysely<InlangDatabaseSchema>;
}) {
	const id = await args.state.id.get();
	const settings = await args.state.settings.get();
	const plugins = await args.state.plugins.get();

	if (settings.telemetry === "off") {
		return;
	}

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
		projectId: id,
		settings,
		properties: {
			// Insight: Which app is used by the SDK
			applicationId: args.applicationId,
			applicationVersion: args.applicationVersion,
			// Insight: How many languages are used, etc.
			settings,
			// Insight on the used plugins (which one's to prioritize)
			pluginKeys: plugins.map((plugin) => plugin.key),
			// Insight: Which version of the SDK is used (can be used to deprecate old versions)
			sdkVersion: ENV_VARIABLES.SDK_VERSION,
			// Insight: Scale of projects (what project size to optimize for)
			numBundles: bundles?.count,
			numMessages: messages?.count,
			numVariants: variants?.count,
		},
	});
}
