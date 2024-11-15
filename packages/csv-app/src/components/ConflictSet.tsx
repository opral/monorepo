import {
	Change,
	Lix,
	resolveChangeConflictBySelecting,
	Snapshot,
} from "@lix-js/sdk";
import { SlButton, SlTag } from "@shoelace-style/shoelace/dist/react";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";

export default function ConflictSet(props: {
	lix: Lix;
	uniqueColumnValue: string;
	changes: (Change & {
		change_conflict_id: string;
		change_conflict_key: string;
		change_conflict_change_set_id: string;
		snapshot_content: Snapshot["content"];
		is_current_branch_pointer: number;
		is_in_current_branch: number;
	})[];
}) {
	return (
		<div
			className={"border border-zinc-200 rounded-md pt-2 px-3 pb-4 bg-zinc-50"}
		>
			<div className="flex flex-wrap md:flex-nowrap overflow-x-scroll gap-x-2 gap-y-2 md:gap-y-8">
				<div className="flex md:flex-col">
					<p className="hidden md:block text-zinc-500 md:py-1.5 text-sm">
						UNIQUE VALUE
					</p>
					<p className="md:px-4 md:py-1.5 md:bg-white md:border border-zinc-200 rounded-full md:mr-4 overflow-hidden whitespace-nowrap text-ellipsis">
						{props.uniqueColumnValue}
					</p>
				</div>
				{props.changes.map((change) => {
					const column = change.entity_id.split("|")[2];
					const value = change.snapshot_content?.text;

					return (
						<div
							// key can't be only the entity id in case of a conflict with the same entity id
							key={change.entity_id + change.snapshot_id}
							className={"flex md:flex-col flex-wrap md:flex-nowrap gap-2"}
						>
							{change.is_current_branch_pointer === 1 ? (
								<SlTag size="small">current value</SlTag>
							) : change.is_in_current_branch ? (
								<SlTag size="small">previous value</SlTag>
							) : (
								// hidden tag to keep the layout consistent
								<SlTag className="opacity-0" size="small"></SlTag>
							)}
							<p className="text-zinc-500 py-1 md:py-1.5 w-full md:w-[140px] uppercase text-sm overflow-hidden whitespace-nowrap text-ellipsis">
								{column}
							</p>
							{value ? (
								// insert or update
								<p className="px-3 py-1.5 bg-white border border-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
									{value}
								</p>
							) : (
								// deletion
								<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
							)}
							<SlButton
								className="w-full"
								size="small"
								onClick={async () => {
									props.lix.db.transaction().execute(async (trx) => {
										await resolveChangeConflictBySelecting({
											lix: { ...props.lix, db: trx },
											conflict: {
												id: change.change_conflict_id,
												key: change.change_conflict_key,
												change_set_id: change.change_conflict_change_set_id,
											},
											select: change,
										});
										await saveLixToOpfs({ lix: { ...props.lix, db: trx } });
									});
								}}
							>
								{(() => {
									if (change.is_current_branch_pointer === 1) {
										return "Keep";
									} else if (change.is_in_current_branch) {
										return "Rollback";
									}
									return "Select";
								})()}
							</SlButton>
						</div>
					);
				})}
			</div>
		</div>
	);
}
