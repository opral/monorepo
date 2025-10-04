import type { InlangDatabaseSchema } from "@inlang/sdk"
import { msg } from "../../messages/msg.js"
import type { UpdateBundleMessage } from "../editorView.js"
import type { Kysely } from "kysely"

/**
 * Handle the update of a bundle.
 *
 * @param message - The message containing the change.
 * @param bundleId - The ID of the bundle to update.
 */
export async function handleUpdateBundle({
	db,
	message,
}: {
	db: Kysely<InlangDatabaseSchema>
	message: UpdateBundleMessage
}) {
	const { change } = message

	try {
		if (!change.entityId || !change.entity) {
			throw new Error("No entity or entityId provided")
		}

		await db.transaction().execute(async (trx) => {
			const newData = change.newData as Record<string, any> | undefined

			switch (change.entity) {
				case "bundle": {
					if (newData) {
						await trx
							.updateTable("bundle")
							.set({
								id: newData.id,
								declarations: newData.declarations ?? [],
							})
							.where("id", "=", change.entityId)
							.execute()
					} else {
						await trx.deleteFrom("bundle").where("id", "=", change.entityId).execute()
					}
					break
				}
				case "message": {
					if (newData) {
						const updateResult = await trx
							.updateTable("message")
							.set({
								id: newData.id,
								bundleId: newData.bundleId,
								locale: newData.locale,
								selectors: newData.selectors ?? [],
							})
							.where("id", "=", change.entityId)
							.execute()

						if (Number(updateResult.numUpdatedRows ?? 0) === 0) {
							await trx
								.insertInto("message")
								.values({
									id: newData.id,
									bundleId: newData.bundleId,
									locale: newData.locale,
									selectors: newData.selectors ?? [],
								})
								.execute()
						}
					} else {
						await trx.deleteFrom("message").where("id", "=", change.entityId).execute()
					}
					break
				}
				case "variant": {
					if (newData) {
						const updateResult = await trx
							.updateTable("variant")
							.set({
								id: newData.id,
								messageId: newData.messageId,
								matches: newData.matches ?? [],
								pattern: newData.pattern ?? [],
							})
							.where("id", "=", change.entityId)
							.execute()

						if (Number(updateResult.numUpdatedRows ?? 0) === 0) {
							await trx
								.insertInto("variant")
								.values({
									id: newData.id ?? change.entityId,
									messageId: newData.messageId,
									matches: newData.matches ?? [],
									pattern: newData.pattern ?? [],
								})
								.execute()
						}
					} else {
						await trx.deleteFrom("variant").where("id", "=", change.entityId).execute()
					}
					break
				}
				default:
					console.warn(`Unhandled change entity: ${change.entity}`)
			}
		})
	} catch (e) {
		console.error(`Couldn't update ${change.entity}: ${e}`)
		msg(`Couldn't update ${change.entity}. ${String(e)}`, "error")
	}
}
