import { useNavigate } from "react-router-dom";
import {
	SlAlert,
	SlButton,
	SlDialog,
	SlSelect,
	SlOption,
} from "@shoelace-style/shoelace/dist/react";
import SubNavigation from "../components/SubNavigation.tsx";
import { useAtom } from "jotai";
import {
	activeFileAtom,
	parsedCsvAtom,
	uniqueColumnAtom,
} from "../routes/editor/state.ts";
import { useMemo, useState } from "react";
import { lixAtom } from "../state.ts";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";

export default function Layout(props: { children: React.ReactNode }) {
	const [activeFile] = useAtom(activeFileAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [parsedCsv] = useAtom(parsedCsvAtom);
	const navigate = useNavigate();
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
		<>
			<SlDialog label="Select Unique Column" open={uniqueColumnDialogOpen}>
				<div className="flex flex-col gap-4">
					<p>
						Please select the unique column. This column will be used to
						identify and track changes in the table.
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

			<div className="w-full min-h-screen bg-zinc-50 relative">
				<div className="w-full border-b border-zinc-200 bg-white relative z-90 -mb-[1px]">
					<div className="w-full flex items-center justify-between px-3 min-h-[54px] gap-1 overflow-x-scroll">
						<div className="flex items-center gap-1">
							<div
								className="flex justify-center items-center text-zinc-500 w-9 h-9 hover:bg-zinc-100 hover:text-zinc-950 rounded-lg cursor-pointer"
								onClick={() => navigate("/")}
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
							</div>

							<p className="font-medium opacity-30">/</p>
							<div className="flex justify-center items-center text-zinc-950 h-9 rounded-lg px-2">
								{/* slice away the root slash */}
								<h1 className="font-medium">{activeFile?.path.slice(1)}</h1>
							</div>
						</div>
						<div className="mr-1 flex items-center gap-1.5">
							{/* <SlButton>Select unique column</SlButton> */}
						</div>
					</div>
					<div className="w-full -mt-2 px-3">
						<SubNavigation />
					</div>
				</div>

				{props.children}

				<div className="absolute bottom-[24px] right-[24px] z-90">
					<SlAlert
						className="copied-link-alert"
						variant="primary"
						duration={3000}
						closable
					>
						<svg
							// @ts-expect-error - ts types don't know that svg's have a slot
							slot="icon"
							xmlns="http://www.w3.org/2000/svg"
							width="20px"
							height="20px"
							viewBox="0 0 16 16"
						>
							<g fill="currentColor">
								<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
								<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z" />
							</g>
						</svg>
						Copied link to clipboard
					</SlAlert>
				</div>
			</div>
		</>
	);
}
