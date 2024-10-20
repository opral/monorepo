import { humanId, insertBundleNested } from "@inlang/sdk2";
import { useAtom } from "jotai";
import { bundlesNestedFilteredAtom, projectAtom } from "../state.ts";
import { SlButton } from "@shoelace-style/shoelace/dist/react";

const TableHeader = () => {
	const [bundleNestedFiltered] = useAtom(bundlesNestedFilteredAtom);
	return (
		<div className="flex justify-between items-center gap-4 rounded-t mt-6 pl-3 pr-2 py-[7px] bg-white border-t border-x border-[--sl-color-neutral-300]">
			<span className="text-[14px] leading-none font-medium">
				{bundleNestedFiltered.length} Bundles
			</span>
			<NewBundleButton />
		</div>
	);
};

export default TableHeader;

const NewBundleButton = () => {
	const [project] = useAtom(projectAtom);
	const handleNewBundle = () => {
		if (project) {
			insertBundleNested(project.db, { id: humanId(), messages: [] });
		}
	};
	return (
		<SlButton size="small" onClick={() => handleNewBundle()}>
			Add new bundle
		</SlButton>
	);
};
