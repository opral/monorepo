import type { openLix } from "./open/openLix.js";

export type Lix = Awaited<ReturnType<typeof openLix>>;

export type LixReadonly = Pick<Lix, "plugins"> & {
	db: {
		selectFrom: Lix["db"]["selectFrom"];
	};
};
