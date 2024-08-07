import { useEffect, useState } from "react";
import { projectAtom } from "../state.ts";
import { useAtom } from "jotai";
import { BundleNested, selectBundleNested } from "@inlang/sdk2";
import { ReactBundle } from "./InlangBundle.tsx";

const DiffBundleView = (props: { changes: any[]; bundleId: string }) => {
	const [project] = useAtom(projectAtom);
	const [bundle, setBundle] = useState<BundleNested | undefined>(undefined);
	const [oldBundle, setOldBundle] = useState<BundleNested | undefined>(
		undefined
	);

	useEffect(() => {
		if (!project) return;
		queryNewBundle();
		setInterval(async () => {
			queryNewBundle();
		}, 2000);
	}, []);

	const queryNewBundle = async () => {
		if (!project) return;
		const bundle = await selectBundleNested(project.db)
			.where("bundle.id", "=", props.bundleId)
			.executeTakeFirst();

		if (bundle) {
			setBundle(bundle);
			const oldBundle = structuredClone(bundle);
			for (const change of props.changes) {
				const latestCommitedChange = await getLatestCommitedChange(change);
				if (
					latestCommitedChange &&
					latestCommitedChange.value &&
					latestCommitedChange.type === "variant"
				) {
					const message = oldBundle.messages.find(
						(message) => message.id === latestCommitedChange.value!.messageId
					);
					if (message) {
						const variant = message.variants.find(
							(variant) => variant.id === latestCommitedChange.value!.id
						);
						if (variant) {
							variant.match = latestCommitedChange.value?.match;
							variant.pattern = latestCommitedChange.value?.pattern;
						}
					}
				}
			}
			setOldBundle(oldBundle);
		}
	};

	const getLatestCommitedChange = async (change: any) => {
		if (!project) return;
		const latestCommitedChange = await project.lix.db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "is not", null)
			.where("type", "=", "variant")
			.where((eb) => eb.ref("value", "->>").key("id"), "=", change.value?.id)
			.innerJoin("commit", "commit.id", "change.commit_id")
			.orderBy("commit.zoned_date_time desc")
			.executeTakeFirst();

		if (latestCommitedChange) {
			return latestCommitedChange;
		} else {
			return;
		}
	};

	return (
		<div className="bg-zinc-100 rounded p-4 mt-4">
			<h3 className="font-medium text-[16px] pb-4">{props.bundleId}</h3>
			{props.changes.map((change) => (
				<p className="text-zinc-600" key={change.id}>
					<span className="font-bold text-zinc-950">You</span> changed the{" "}
					<span className="font-bold text-zinc-950">{change.type}</span> with
					the id{" "}
					<span className="font-bold text-zinc-950">{change.value?.id}</span>
				</p>
			))}
			<div className="flex gap-8">
				<div className="flex-1 opacity-50">
					<p className="font-medium pb-2 pt-4">Old:</p>
					{oldBundle && (
						<ReactBundle
							style={{ pointerEvents: "none" }}
							bundle={oldBundle}
							settings={project?.settings.get()}
						/>
					)}
				</div>
				<div className="flex-1">
					<p className="font-medium pb-2 pt-4">New:</p>
					{bundle && (
						<ReactBundle
							style={{ pointerEvents: "none" }}
							bundle={bundle}
							settings={project?.settings.get()}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default DiffBundleView;
