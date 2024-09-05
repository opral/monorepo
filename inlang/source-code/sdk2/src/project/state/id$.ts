import { type Lix } from "@lix-js/sdk";
import { map, share, type Observable } from "rxjs";
import { pollQuery } from "../../query-utilities/pollQuery.js";

export function createId$(args: { lix: Lix }): Observable<string> {
	const settings$ = pollQuery(() =>
		args.lix.db
			.selectFrom("file")
			.where("path", "=", "/project_id")
			.selectAll()
			.executeTakeFirstOrThrow()
	).pipe(
		map((file) => new TextDecoder().decode(file.data)),
		share()
	);
	return settings$;
}
