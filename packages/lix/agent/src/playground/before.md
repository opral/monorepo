# @lix-js/react-utils

Lightweight React hooks for building UIs on top of the Lix SDK. This early version focuses on reading data with Suspense and accessing the Lix instance from context.

- Suspense-friendly data reads
- Simple provider: `LixProvider`
- Core hooks: `useLix`, `useQuery`

## Installation

```bash
npm install @lix-js/react-utils
```

## useQuery

Run a Kysely query that suspends during the initial fetch. The callback receives `{ lix }` and must return a `SelectQueryBuilder`.

```tsx
import { Suspense } from "react";
import { useQuery } from "@lix-js/react-utils";

function KeyValueList() {
	const rows = useQuery(({ lix }) =>
		lix.db.selectFrom("key_value").where("key", "like", "demo_%").selectAll()
	);

	return (
		<ul>
			{rows.map((r) => (
				<li key={r.key}>
					{r.key}: {String(r.value)}
				</li>
			))}
		</ul>
	);
}

export function Page() {
	return (
		<Suspense fallback={<div>Loading…</div>}>
			<KeyValueList />
		</Suspense>
	);
}
```
