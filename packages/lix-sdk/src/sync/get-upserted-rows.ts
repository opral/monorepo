import type { Lix } from "../lix/open-lix.js"
import type { VectorClock } from "./merge-state.js"

export async function getUpsertedRows(args: {
	/**
     * the lix to merge their state into
     */
    lix: Lix,
    /**
     * the the vector clock of the lix to merge in
     */
    targetVectorClock: VectorClock, 
}): Promise<{
	state: any
	upsertedRows: Record<string, any[]>
}> {
	const upsertedRows: Record<string, any[]> = {
	}

	let clientState: VectorClock = []

	await args.lix.db.transaction().execute(async (trx) => {

		clientState = await args.lix.db.selectFrom('vector_clock').select(({ fn }) => {
			return ['session', fn.max<number>('session_time').as('time')]
		}).groupBy('session').execute()
		// TODO SYNC
		// use the target vector clock to collect all changed rows the target is not aware of
		const operationsToPush = trx
		.selectFrom('vector_clock')
		.selectAll('vector_clock')

		if (args.targetVectorClock.length > 0) {
			operationsToPush.where((eb) => {
				
				const ors: any[] = []
				const knownSessions = args.targetVectorClock.map(sessionTime => sessionTime.session)
				ors.push(eb('session', 'not in', knownSessions))
				for (const sessionTime of args.targetVectorClock) {
					ors.push(eb('session', '=', sessionTime.session).and("session_time", "=", sessionTime.time))
				}

				return eb.or(ors) as any
			})
		}

		upsertedRows['vector_clock'] = await operationsToPush.execute()

	
		for (const operation of upsertedRows['vector_clock']) {
			const tableName = operation.table_name
			if (upsertedRows[tableName] === undefined) {
				upsertedRows[tableName] = []
			}
			if (tableName === "snapshot") {
				// ignore inserted column id
				upsertedRows[tableName].push(
					await trx.selectFrom(tableName).select('content').where('id', '=', operation.row_id).executeTakeFirstOrThrow()
				)
			} else if (tableName === 'key_value') {
				upsertedRows[tableName].push(
					await trx.selectFrom(tableName).selectAll().where('key', '=', operation.row_id).executeTakeFirstOrThrow()
				)
			} else {
				upsertedRows[tableName].push(
					await trx.selectFrom(tableName as any).selectAll().where('id', '=', operation.row_id).executeTakeFirstOrThrow()
				)
			}
		}
	})	
	return {
		state,
		upsertedRows
	}

}
