import { type Lix } from "@lix-js/sdk";
import { map, share, type Observable } from "rxjs";
import type { ProjectSettings } from "../../schema/settings.js";
import { withLanguageTagToLocaleMigration } from "../../migrations/v2/withLanguageTagToLocaleMigration.js";
import { pollQuery } from "../../query-utilities/pollQuery.js";

export function createSettings$(args: {
	lix: Lix;
}): Observable<ProjectSettings> {
	const settings$ = pollQuery(() =>
		args.lix.db
			.selectFrom("file")
			.where("path", "=", "/settings.json")
			.selectAll()
			.executeTakeFirstOrThrow()
	).pipe(
		map((settingsFile) => {
			const decoded = new TextDecoder().decode(settingsFile.data);
			const parsed = JSON.parse(decoded);
			const withMigration = withLanguageTagToLocaleMigration(parsed);
			return withMigration;
		}),
		share()
	);
	return settings$;
}
