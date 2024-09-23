import { useEffect, useState } from "react";
import { projectAtom, settingsAtom } from "../state.ts";
import { useAtom } from "jotai";
import {
	BundleNested,
	InlangProject,
	updateBundleNested,
	selectBundleNested,
} from "@inlang/sdk2";
import SingleDiffBundle from "./SingleDiffBundle.tsx";
import { SlButton } from "@shoelace-style/shoelace/dist/react";

const DiffBundleView = (props: { changes: any[]; bundleId: string }) => {
	const [project] = useAtom(projectAtom);
	const [settings] = useAtom(settingsAtom);
	const [bundle, setBundle] = useState<BundleNested | undefined>(undefined);
	const [oldBundle, setOldBundle] = useState<BundleNested | undefined>(
		undefined
	);
	const [loadingDiscard, setLoadingDiscard] = useState(false);

	useEffect(() => {
		if (!project) return;
		queryNewBundle(project, props, setBundle, setOldBundle);
		const interval = setInterval(async () => {
			await queryNewBundle(project, props, setBundle, setOldBundle);
		}, 1000);
		return () => clearInterval(interval);
	}, [project, props]);

	const handleDiscard = async () => {
		if (project && oldBundle) {
			setLoadingDiscard(true);
			await updateBundleNested(project?.db, oldBundle);
		}
	};

	return (
		<div className="bg-white border-x border-zinc-200 p-4">
			<div className="flex justify-between items-center mb-3">
				<h3 className="font-medium text-[14px]!">{props.bundleId}</h3>
				<div className="flex items-center gap-3">
					<div className="text-xs! text-zinc-700 bg-zinc-300 h-5 rounded flex items-center px-2 font-medium">
						{props.changes.length}{" "}
						{props.changes.length === 1 ? "change" : "changes"}
					</div>
					<SlButton
						size="small"
						loading={loadingDiscard}
						onClick={() => handleDiscard()}
					>
						Discard
					</SlButton>
				</div>
			</div>

			{/* 
			* TODO unbundle
			- change `type` to `show`

			<div className="flex">
				<inlang-bundle old neu show="old">
					{messages.map((message) => {
						const previousMessage = lix.db
							.selectFrom("change")
							.where("type", "=", "message");
						return (
							<inlang-message old={previousMessage} neu={message} show="neu">
								<inlang-variant old neu show="old"></inlang-variant>
							</inlang-message>
						);
					})}
				</inlang-bundle>
				<inlang-bundle old neu show="neu">
					{messages.map((message) => {
						const previousMessage = lix.db
							.selectFrom("change")
							.where("type", "=", "message");
						return (
							<inlang-message old={previousMessage} neu={message} show="neu" editable>
								{variants.map((variant) => {
									if (pendingChange === false && variant.isRef === false){
										return ""
									}
									return <inlang-variant old neu show="neu" editable></inlang-variant>;
								})}
							</inlang-message>
						);
					})}
				</inlang-bundle>
			</div> */}
			<div className="flex gap-4">
				<div className="flex-1">
					{oldBundle && bundle && project && (
						<SingleDiffBundle
							bundle={bundle}
							oldBundle={oldBundle}
							settings={settings}
							changes={props.changes}
							show="old"
						/>
					)}
				</div>
				<div className="flex-1">
					{oldBundle && bundle && project && (
						<SingleDiffBundle
							bundle={bundle}
							oldBundle={oldBundle}
							settings={settings}
							changes={props.changes}
							show="neu"
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default DiffBundleView;

const queryNewBundle = async (
	project: InlangProject,
	props: Parameters<typeof DiffBundleView>[0],
	setBundle: (bundle: BundleNested) => void,
	setOldBundle: (bundle: BundleNested) => void
) => {
	const bundle = await selectBundleNested(project.db)
		.where("bundle.id", "=", props.bundleId)
		.executeTakeFirst();

	if (bundle) {
		setBundle(bundle);
		const oldBundle = structuredClone(bundle);
		// TODO proper query
		for (const change of props.changes) {
			const latestCommitedChange = await getLatestCommitedChange(
				project,
				change
			);
			if (change && change.value && change.type === "variant") {
				for (const message of oldBundle.messages) {
					for (const variant of message.variants) {
						if (variant.id === change.value.id) {
							if (latestCommitedChange?.value?.pattern) {
								//update
								variant.pattern = latestCommitedChange.value.pattern;
								variant.matches = latestCommitedChange.value.matches;
							} else {
								//insert
								message.variants = message.variants.filter(
									(variant) => variant.id !== change.value.id
								);
							}
						}
					}
				}
			}
		}
		setOldBundle(oldBundle);
	}
};

const getLatestCommitedChange = async (project: InlangProject, change: any) => {
	const latestCommitedChange = await project.lix.db
		.selectFrom("change")
		.selectAll()
		.where("commit_id", "is not", null)
		.where("type", "=", "variant")
		.where((eb) => eb.ref("value", "->>").key("id"), "=", change.value?.id)
		.innerJoin("commit", "commit.id", "change.commit_id")
		.orderBy("commit.created_at desc")
		.executeTakeFirst();

	if (latestCommitedChange) {
		return latestCommitedChange;
	} else {
		return;
	}
};
