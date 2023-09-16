import type { ProjectSettings } from "../index.js"
import type { ProjectConfigV1 } from "../interface.v1.js"
import type { ProjectSettingsV2 } from "../interface.v2.js"
import { migrate1to2 } from "./1-to-2.js"

/**
 * Migrates the schema to the latest version if required.
 */
export function migrateIfOutdated(schema: ProjectConfigV1 | ProjectSettingsV2): ProjectSettings {
	if ((schema as ProjectConfigV1).settings) {
		return migrate1to2(schema as ProjectConfigV1)
	}
	return schema as ProjectSettings
}
