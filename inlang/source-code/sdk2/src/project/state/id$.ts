import { type Lix } from "@lix-js/sdk";
import { filter, map, share, type Observable } from "rxjs";
import { pollQuery } from "../../query-utilities/pollQuery.js";

export function createId$(args: { lix: Lix }): Observable<string> {
	const settings$ = pollQuery(() =>
		args.lix.db
			.selectFrom("file")
			.where("path", "=", "/project_id")
			.selectAll()
			.executeTakeFirst()
	).pipe(
		// undefined can happen if a project has no id yet
		// the project id will be automatically generated
		// shortly after
		filter((file) => file !== undefined),
		map((file) => new TextDecoder().decode(file.data)),
		share()
	);
	return settings$;
}
