// NOTE: we coult be more general for primary key field (see: https://github.com/pubkey/rxdb/blob/3bdfd66d1da5ccf9afe371b6665770f11e67908f/src/types/rx-schema.d.ts#L106) but enougth for the POC

export type HasId = {
	id: string
}
