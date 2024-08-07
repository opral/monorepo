import { useEffect, useState } from "react";
import { projectAtom } from "../state.ts";
import { useAtom } from "jotai";
import { BundleNested, selectBundleNested } from "@inlang/sdk2";
import { ReactBundle } from "./InlangBundle.tsx";
import { jsonArrayFrom } from "kysely/helpers/sqlite";

const DiffBundleView = (props: { change: any }) => {
	const [project] = useAtom(projectAtom);
	const [bundle, setBundle] = useState<BundleNested | undefined>(undefined);
	const [oldBundle, setOldBundle] = useState<BundleNested | undefined>(
		undefined
	);

	useEffect(() => {
		if (!project) return;
		queryNewBundle();
		queryOldBundle();
		setInterval(async () => {
			queryNewBundle();
			queryOldBundle();
		}, 2000);
	}, []);

	const queryNewBundle = async () => {
		if (!project) return;
		const bundle = await selectBundleNested(project.db)
			.where((eb) =>
				eb.exists(
					project.db
						.selectFrom("message")
						.selectAll()
						.where((em) =>
							em.exists(
								project.db
									.selectFrom("variant")
									.selectAll()
									.where("id", "is", props.change.value.id)
							)
						)
				)
			)
			.executeTakeFirst();
		setBundle(bundle);
	};

	const queryOldBundle = async () => {
		if (!project) return;
		const result = await project.lix.db
			.selectFrom("change")
			.select((ec) => [
				"commit_id",
				"value",
				jsonArrayFrom(
					ec
						.selectFrom("commit")
						.select(["commit.zoned_date_time"])
						.whereRef("commit_id", "is", "commit.id")
				).as("commit"),
			])
			.execute();
	};

	return (
		<div className="bg-zinc-100 rounded p-4 mt-4">
			<h3 className="pb-2">
				{props.change.value.id} | {props.change.type} changed
			</h3>
			<p className="text-sm">{JSON.stringify(props.change)}</p>
			<p className="font-medium pb-2 pt-4">New:</p>
			{bundle && (
				<ReactBundle
					style={{ pointerEvents: "none" }}
					bundle={bundle}
					settings={project?.settings.get()}
				/>
			)}
			<p className="font-medium pb-2 pt-4">Old:</p>
		</div>
	);
};

export default DiffBundleView;
