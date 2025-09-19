import type { ProjectSettings } from "../json-schema/settings.js";
import type { NewVariant } from "../database/schema.js";
import type { InlangPlugin, VariantImport } from "../plugin/schema.js";
import type { ImportFile, InlangProject } from "../project/api.js";
import { humanId } from "../human-id/human-id.js";
import { uuidV7 } from "@lix-js/sdk";
import {
	PluginDoesNotImplementFunctionError,
	PluginMissingError,
} from "../plugin/errors.js";

const isUniqueConstraintError = (error: unknown): boolean => {
	const resultCode = (error as any)?.resultCode;
	if (resultCode === 1555 || resultCode === 2067) {
		return true;
	}
	const maybeMessage = (error as any)?.message;
	const message = typeof maybeMessage === "string" ? maybeMessage : "";
	return (
		message.includes("Primary key constraint violation") ||
		message.includes("Unique constraint violation") ||
		message.includes("unique constraint failed")
	);
};

export async function importFiles(args: {
	files: ImportFile[];
	readonly pluginKey: string;
	readonly settings: ProjectSettings;
	readonly plugins: readonly InlangPlugin[];
	readonly project: Pick<InlangProject, "db" | "lix">;
}) {
	const plugin = args.plugins.find((p) => p.key === args.pluginKey);

	if (!plugin) throw new PluginMissingError({ plugin: args.pluginKey });

	if (!plugin.importFiles) {
		throw new PluginDoesNotImplementFunctionError({
			plugin: args.pluginKey,
			function: "importFiles",
		});
	}

	const imported = await plugin.importFiles({
		files: args.files,
		settings: structuredClone(args.settings),
	});

	const generateUuid = () => uuidV7({ lix: args.project.lix });

	await args.project.db.transaction().execute(async (trx) => {
		const insertBundleIfMissing = async (
			bundleId: string,
			declarations: any[] = []
		) => {
			const existingBundle = await trx
				.selectFrom("bundle")
				.select("id")
				.where("id", "=", bundleId)
				.executeTakeFirst();

			if (existingBundle) {
				if (declarations.length > 0) {
					await trx
						.updateTable("bundle")
						.set({ declarations })
						.where("id", "=", bundleId)
						.execute();
				}
				return;
			}

			await trx
				.insertInto("bundle")
				.values({ id: bundleId, declarations })
				.execute();
		};
		// upsert every bundle
		for (const bundle of imported.bundles) {
			const bundleId = bundle.id ?? humanId();
			if (bundle.id === undefined) {
				bundle.id = bundleId;
			}
			const bundleRecord = {
				id: bundleId,
				declarations: bundle.declarations ?? [],
			};

			try {
				await trx.insertInto("bundle").values(bundleRecord).execute();
			} catch (error) {
				if (isUniqueConstraintError(error)) {
					await trx
						.updateTable("bundle")
						.set({ declarations: bundleRecord.declarations })
						.where("id", "=", bundleId)
						.execute();
				} else {
					throw error;
				}
			}
		}
		// upsert every message
		for (const message of imported.messages) {
			await insertBundleIfMissing(message.bundleId);

			if (message.id === undefined) {
				const existingMessage = await trx
					.selectFrom("message")
					.where("bundleId", "=", message.bundleId)
					.where("locale", "=", message.locale)
					.select("id")
					.executeTakeFirst();
				message.id = existingMessage?.id ?? (await generateUuid());
			}

			const messageRecord = {
				id: message.id,
				bundleId: message.bundleId,
				locale: message.locale,
				selectors: message.selectors ?? [],
			};

			try {
				await trx.insertInto("message").values(messageRecord).execute();
			} catch (e) {
				if ((e as any)?.resultCode === 787) {
					await insertBundleIfMissing(messageRecord.bundleId);
					await trx.insertInto("message").values(messageRecord).execute();
				} else if (isUniqueConstraintError(e)) {
					await trx
						.updateTable("message")
						.set({
							bundleId: messageRecord.bundleId,
							locale: messageRecord.locale,
							selectors: messageRecord.selectors,
						})
						.where("id", "=", messageRecord.id!)
						.execute();
				} else {
					throw e;
				}
			}
		}
		// upsert every variant
		for (const variant of imported.variants) {
			if (variant.id === undefined || variant.messageId === undefined) {
				let messageId: string | undefined = variant.messageId;
				if (messageId === undefined) {
					const existingMessage = await trx
						.selectFrom("message")
						.where("bundleId", "=", variant.messageBundleId)
						.where("locale", "=", variant.messageLocale)
						.selectAll()
						.executeTakeFirst();

					if (existingMessage) {
						messageId = existingMessage.id;
					} else {
						await insertBundleIfMissing(variant.messageBundleId);
						messageId = await generateUuid();
						await trx
							.insertInto("message")
							.values({
								id: messageId,
								bundleId: variant.messageBundleId,
								locale: variant.messageLocale,
								selectors: [],
							})
							.execute();
					}
				}

				const resolvedMessageId = messageId!;
				const existingVariants = await trx
					.selectFrom("variant")
					.where("messageId", "=", resolvedMessageId)
					.selectAll()
					.execute();

				const duplicateVariant = existingVariants.find(
					(v) => JSON.stringify(v.matches) === JSON.stringify(variant.matches)
				);

				(variant as VariantImport).id =
					duplicateVariant?.id ?? variant.id ?? (await generateUuid());
				(variant as VariantImport).messageId = resolvedMessageId;
			}

			const toBeInsertedVariant: NewVariant = {
				...variant,
				id: variant.id ?? (await generateUuid()),
				messageId: variant.messageId!,
				matches: variant.matches ?? [],
				pattern: variant.pattern ?? [],
				// @ts-expect-error - bundle id is provided by VariantImport but not needed when inserting
				messageBundleId: undefined,
				messageLocale: undefined,
			};

			const variantUpdateValues = {
				messageId: toBeInsertedVariant.messageId,
				matches: toBeInsertedVariant.matches,
				pattern: toBeInsertedVariant.pattern,
			};

			try {
				await trx.insertInto("variant").values(toBeInsertedVariant).execute();
			} catch (error) {
				if (isUniqueConstraintError(error)) {
					await trx
						.updateTable("variant")
						.set(variantUpdateValues)
						.where("id", "=", toBeInsertedVariant.id!)
						.execute();
				} else {
					throw error;
				}
			}
		}

		// ensure bundles retain the declarations calculated by the plugin
		for (const bundle of imported.bundles) {
			if (!bundle.id) {
				continue;
			}
			await trx
				.updateTable("bundle")
				.set({ declarations: bundle.declarations ?? [] })
				.where("id", "=", bundle.id)
				.execute();
		}
	});
}
