import clsx from "clsx";
import { SquareDot, SquareMinus, SquarePlus } from "lucide-react";
import type { WorkingFileSummary } from "./queries";

type ChangedFilesListProps = {
	files: WorkingFileSummary[];
	selectedFiles: Set<string>;
	onToggleFile: (fileId: string) => void;
	onToggleAll: () => void;
	onOpenDiff?: (fileId: string, filePath: string) => void;
};

/**
 * Displays the list of working tree files with selection controls for checkpoint creation.
 *
 * @example
 * <ChangedFilesList
 *   files={files}
 *   selectedFiles={selected}
 *   onToggleFile={toggle}
 *   onToggleAll={toggleAll}
 *   onOpenDiff={(fileId, path) => console.log(fileId, path)}
 * />
 */
export function ChangedFilesList({
	files,
	selectedFiles,
	onToggleFile,
	onToggleAll,
	onOpenDiff,
}: ChangedFilesListProps) {
	const showHeader = files.length > 0;
	const allSelected = showHeader && selectedFiles.size === files.length;

	return (
		<div className="flex flex-col py-2">
			{showHeader ? (
				<div className="flex w-full items-center justify-between px-2 py-1">
					<span className="text-xs font-medium text-muted-foreground">
						Changed files {files.length}
					</span>
					<input
						type="checkbox"
						checked={allSelected}
						onChange={onToggleAll}
						aria-label="Select all files"
						className={checkboxClasses}
					/>
				</div>
			) : null}

			<div className="flex flex-col">
				{files.map((file) => {
					const decodedPath = decodeURIComponent(file.path);
					const isSelected = selectedFiles.has(file.id);
					return (
						<div
							key={file.id}
							className={clsx(
								rowContainerClasses,
								isSelected && "border-brand-200 bg-brand-50",
							)}
						>
							<button
								type="button"
								onClick={() => onOpenDiff?.(file.id, file.path)}
								className="flex flex-1 items-center gap-2 rounded-sm bg-transparent px-0 text-left text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
							>
								<StatusIcon status={file.status} />
								<span
									className={clsx(
										"max-w-[16rem] truncate",
										file.status === "removed" &&
											"line-through text-muted-foreground",
										file.status !== "removed" && "text-foreground",
									)}
									title={decodedPath}
								>
									{decodedPath}
								</span>
							</button>
								<input
									type="checkbox"
									checked={isSelected}
									onChange={() => onToggleFile(file.id)}
									aria-label={`Select ${decodedPath}`}
									className={checkboxClasses}
								/>
						</div>
					);
				})}
			</div>

			{files.length === 0 && (
				<div className="py-4 text-center text-xs text-muted-foreground">
					No changes
				</div>
			)}
		</div>
	);
}

const rowContainerClasses =
	"flex w-full items-center justify-between rounded-sm border border-transparent bg-transparent px-2 py-1 text-xs transition-colors hover:border-border hover:bg-muted";

const checkboxClasses = "h-3.5 w-3.5 cursor-pointer";

function StatusIcon({ status }: { status: WorkingFileSummary["status"] }) {
	const Icon = statusIconComponent(status);
	return (
		<Icon
			className={clsx("h-4 w-4 shrink-0", statusIconClass(status))}
			strokeWidth={2}
		/>
	);
}

function statusIconComponent(status: WorkingFileSummary["status"]) {
	switch (status) {
		case "added":
			return SquarePlus;
		case "removed":
			return SquareMinus;
		case "modified":
		default:
			return SquareDot;
	}
}

function statusIconClass(status: WorkingFileSummary["status"]) {
	switch (status) {
		case "added":
			return "text-green-600";
		case "removed":
			return "text-red-600";
		case "modified":
		default:
			return "text-amber-500";
	}
}
