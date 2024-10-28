import { Link, useLocation } from "react-router-dom";
import {
	SlButton,
	SlSelect,
	SlOption,
	SlBadge,
	SlDialog,
} from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import {
	activeFileAtom,
	parsedCsvAtom,
	unconfirmedChangesAtom,
	uniqueColumnAtom,
} from "../routes/editor/state.ts";
import { useMemo, useRef, useState } from "react";
import { lixAtom } from "../state.ts";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";
import clsx from "clsx";
import { Change, ChangeSet, Lix } from "@lix-js/sdk";
import { SlInput } from "@shoelace-style/shoelace/dist/react";

export default function Layout(props: { children: React.ReactNode }) {
	const [activeFile] = useAtom(activeFileAtom);
	const [unconfirmedChanges] = useAtom(unconfirmedChangesAtom);
	const [showConfirmChangesDialog, setShowConfirmChangesDialog] =
		useState(false);

	return (
		<>
			{showConfirmChangesDialog && (
				<ConfirmChangesDialog
					onClose={() => {
						setShowConfirmChangesDialog(false);
					}}
				/>
			)}
			<UniqueColumnDialog />
			<div className="w-full min-h-full bg-zinc-50 relative">
				<div className="w-full border-b border-zinc-200 bg-white relative z-90 -mb-[1px]">
					<div className="w-full flex items-center justify-between px-3 min-h-[54px] gap-1 overflow-x-scroll">
						<div className="flex items-center gap-1">
							<Link
								to="/"
								className="flex justify-center items-center text-zinc-500 w-9 h-9 hover:bg-zinc-100 hover:text-zinc-950 rounded-lg cursor-pointer"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24px"
									height="24px"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M21 20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.49a1 1 0 0 1 .386-.79l8-6.223a1 1 0 0 1 1.228 0l8 6.223a1 1 0 0 1 .386.79zm-2-1V9.978l-7-5.444l-7 5.444V19z"
									/>
								</svg>
							</Link>

							<p className="font-medium opacity-30">/</p>
							<div className="flex justify-center items-center text-zinc-950 h-9 rounded-lg px-2">
								{/* slice away the root slash */}
								<h1 className="font-medium">{activeFile?.path.slice(1)}</h1>
							</div>
						</div>

						<div className="mr-1 flex items-center gap-1.5">
							{unconfirmedChanges.length > 0 && (
								<SlButton
									size="small"
									variant="neutral"
									disabled={unconfirmedChanges.length === 0}
									onClick={() => setShowConfirmChangesDialog(true)}
								>
									Confirm Changes
								</SlButton>
							)}
						</div>
					</div>
					<div className="px-3 flex gap-1">
						<NavItem to={`/editor?f=${activeFile.id}`} name="Edit" />
						<NavItem
							to={`/graph?f=${activeFile.id}`}
							counter={
								unconfirmedChanges.length !== 0
									? unconfirmedChanges.length
									: undefined
							}
							name="Changes"
						/>
					</div>
				</div>

				{props.children}
			</div>
		</>
	);
}

const NavItem = (props: { to: string; name: string; counter?: number }) => {
	const location = useLocation();
	const isActive = location.pathname + location.search === props.to;
	return (
		<Link to={props.to} className={clsx("pb-1 relative")}>
			<div
				className={clsx(
					"h-8 items-center px-2 flex text-[15px]! font-medium box-border text-zinc-500 hover:bg-zinc-100 rounded",
					isActive ? "text-zinc-950" : ""
				)}
			>
				{props.counter && (
					<SlBadge className="mr-2" pill variant="neutral">
						{props.counter}
					</SlBadge>
				)}
				{props.name}
			</div>

			<div
				className={clsx(
					"w-[calc(100%_-_8px)] mx-[4px] h-[2px] bottom-0 right-0 absolute",
					isActive ? "bg-zinc-950" : "bg-transparent"
				)}
			></div>
		</Link>
	);
};

const UniqueColumnDialog = () => {
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [parsedCsv] = useAtom(parsedCsvAtom);
	const [lix] = useAtom(lixAtom);
	const [selectedUniqueColumn, setSelectedUniqueColumn] = useState<
		string | null
	>(null);

	const uniqueColumnDialogOpen = useMemo(
		() => (!uniqueColumn ? true : false),
		[uniqueColumn]
	);

	const handleUniqueColumnDialogClose = async () => {
		await lix.db
			.updateTable("file")
			.set("metadata", {
				unique_column: selectedUniqueColumn,
			})
			.execute();
		await saveLixToOpfs({ lix });
	};
	return (
		<SlDialog label="Select Unique Column" open={uniqueColumnDialogOpen}>
			<div className="flex flex-col gap-4">
				<p>
					Please select the unique column. This column will be used to identify
					and track changes in the table.
				</p>
				<SlSelect
					className="h-40"
					onSlChange={(event) =>
						setSelectedUniqueColumn(
							// @ts-expect-error - ts types don't know that value is a string
							event?.target?.value?.replaceAll("___", " ")
						)
					}
				>
					{(parsedCsv.meta.fields ?? []).map((column) => (
						// options can't have spaces
						<SlOption key={column} value={column.replaceAll(" ", "___")}>
							{column}
						</SlOption>
					))}
				</SlSelect>
			</div>
			<SlButton
				slot="footer"
				variant="primary"
				onClick={handleUniqueColumnDialogClose}
			>
				Confirm
			</SlButton>
		</SlDialog>
	);
};

const ConfirmChangesDialog = (props: { onClose: () => void }) => {
	const [unconfirmedChanges] = useAtom(unconfirmedChangesAtom);
	const [lix] = useAtom(lixAtom);
	const [description, setDescription] = useState("");
	const ref = useRef(null);

	const handleConfirmChanges = async () => {
		const changeSet = await confirmChanges(lix, unconfirmedChanges);
		if (description !== "") {
			await addDiscussionToChangeSet(lix, changeSet, description);
			await saveLixToOpfs({ lix });
		}
		props.onClose();
	};

	return (
		<SlDialog label="Confirm Changes" open={true} ref={ref}>
			<SlInput
				placeholder="Describe the changes"
				onInput={(event: any) => setDescription(event.target?.value)}
			></SlInput>
			<SlButton slot="footer" variant="primary" onClick={handleConfirmChanges}>
				{description === "" ? "Confirm without description" : "Confirm"}
			</SlButton>
		</SlDialog>
	);
};

const confirmChanges = async (lix: Lix, unconfirmedChanges: Change[]) => {
	const changeSet = await lix.db.transaction().execute(async (trx) => {
		// create a new set
		const newChangeSet = await trx
			.insertInto("change_set")
			.defaultValues()
			.returning("id")
			.executeTakeFirstOrThrow();

		// get the id of the confirmed tag
		const confirmedLabel = await trx
			.selectFrom("label")
			.where("name", "=", "confirmed")
			.select("id")
			.executeTakeFirstOrThrow();

		// tag the set as confirmed
		await trx
			.insertInto("change_set_label")
			.values({
				change_set_id: newChangeSet.id,
				label_id: confirmedLabel.id,
			})
			.execute();

		// insert the changes into the set
		for (const change of unconfirmedChanges) {
			await trx
				.insertInto("change_set_item")
				.values({
					change_set_id: newChangeSet.id,
					change_id: change.id,
				})
				.execute();
		}
		return newChangeSet;
	});
	await saveLixToOpfs({ lix });
	return changeSet;
};

const addDiscussionToChangeSet = async (
	lix: Lix,
	changeSet: ChangeSet,
	content: string
) => {
	await lix.db.transaction().execute(async (trx) => {
		const discussion = await trx
			.insertInto("discussion")
			.values({
				change_set_id: changeSet.id,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("comment")
			.values({
				discussion_id: discussion.id,
				content,
			})
			.execute();
	});
};