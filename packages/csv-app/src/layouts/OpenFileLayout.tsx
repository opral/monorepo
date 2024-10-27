import { Link, useLocation } from "react-router-dom";
import {
	SlButton,
	SlDialog,
	SlSelect,
	SlOption,
	SlBadge,
} from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import {
	activeFileAtom,
	parsedCsvAtom,
	uniqueColumnAtom,
} from "../routes/editor/state.ts";
import { useMemo, useState } from "react";
import { lixAtom } from "../state.ts";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";
import clsx from "clsx";

export default function Layout(props: { children: React.ReactNode }) {
	const [activeFile] = useAtom(activeFileAtom);

	return (
		<>
			<UniqueColumnDialog />
			<div className="w-full min-h-screen bg-zinc-50 relative">
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
							<SlButton size="small">Confirm</SlButton>
						</div>
					</div>
					<div className="px-3 flex gap-1">
						<NavItem to={`/editor?f=${activeFile.id}`} name="Edit" />
						<NavItem to={`/graph?f=${activeFile.id}`} name="Changes" />
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
				{props.counter && <SlBadge className="mr-2">{props.counter}</SlBadge>}
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
