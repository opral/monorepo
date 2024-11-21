import { ValuesNode, type KyselyPlugin } from "kysely";

export function SerializeJsonBPlugin(
	jsonbColumns: Record<string, string[]>,
): KyselyPlugin {
	const jsonColumnNames = Object.keys(jsonbColumns).flatMap(
		(key) => jsonbColumns[key]!,
	);

	return {
		transformResult: async (args) => args.result,
		transformQuery: (args) => {
			const query = args.node;

			if (query.kind !== "InsertQueryNode") {
				return query;
			}

			const updatedValues = [];

			for (const [i, value] of (
				(query.values as ValuesNode).values[0]?.values ?? []
			).entries()) {
				if (!jsonColumnNames.includes(query.columns?.[i]?.column?.name ?? "")) {
					updatedValues.push(value);
					continue;
				}
				updatedValues.push(JSON.stringify(value));
			}

			// Return the updated query node
			return query;
		},
	};
}
