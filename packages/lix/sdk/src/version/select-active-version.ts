import type { SelectQueryBuilder } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import type { State } from "../engine/entity-views/types.js";
import type { LixVersion } from "./schema-definition.js";

export function selectActiveVersion(
	lix: Lix
): SelectQueryBuilder<
	LixDatabaseSchema,
	"version" | "active_version",
	State<LixVersion>
> {
	return lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version");
}
