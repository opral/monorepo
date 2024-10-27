import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import ChangeSet from "../../components/ChangeSet.tsx";
import { atom, useAtom } from "jotai";
import { lixAtom, withPollingAtom } from "../../state.ts";

const changeSetsAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	return await lix.db
		.selectFrom("change_set")
		.innerJoin(
			"change_set_item",
			"change_set_item.change_set_id",
			"change_set.id"
		)
		.select("change_set.id")
		.innerJoin("change", "change.id", "change_set_item.change_id")
		.groupBy("change_set.id")
		.orderBy("change.created_at", "asc")
		.distinct()
		.execute();
});

export default function Page() {
	const [changeSets] = useAtom(changeSetsAtom);
	return (
		<OpenFileLayout>
			<div className="px-3 pb-6 pt-3 md:pt-5">
				<div className="mx-auto max-w-7xl bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden">
					{changeSets.map((changeSet) => (
						<ChangeSet key={changeSet.id} id={changeSet.id} />
					))}
				</div>
			</div>
		</OpenFileLayout>
	);
}
