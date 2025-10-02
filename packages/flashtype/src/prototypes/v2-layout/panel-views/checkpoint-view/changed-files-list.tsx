import type { WorkingFileSummary } from "./queries";

type ChangedFilesListProps = {
	files: WorkingFileSummary[];
	selectedFiles: Set<string>;
	onToggleFile: (fileId: string) => void;
	onToggleAll: () => void;
};

export function ChangedFilesList({
	files,
	selectedFiles,
	onToggleFile,
	onToggleAll,
}: ChangedFilesListProps) {
	const showHeader = files.length > 0;
	const allSelected = showHeader && selectedFiles.size === files.length;

	return (
		<div className="flex flex-col gap-1 px-3 py-2">
			{showHeader ? (
				<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
					<span>Changed files {files.length}</span>
					<input
						type="checkbox"
						checked={allSelected}
						onChange={onToggleAll}
						aria-label="Select all files"
						className="h-3.5 w-3.5 cursor-pointer"
					/>
				</div>
			) : null}

			<div className="flex flex-col">
				{files.map((file) => (
					<div
						key={file.id}
						className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50"
					>
						<div className="flex items-center gap-2">
							<div className={`h-1.5 w-1.5 rounded-full ${statusDotClass(file.status)}`} />
							<span className={`text-foreground ${statusTextClass(file.status)}`}>
								{file.path}
							</span>
						</div>
						<input
							type="checkbox"
							checked={selectedFiles.has(file.id)}
							onChange={() => onToggleFile(file.id)}
							aria-label={`Select ${file.path}`}
							className="h-3.5 w-3.5 cursor-pointer"
						/>
					</div>
				))}
			</div>

			{files.length === 0 && (
				<div className="py-4 text-center text-xs text-muted-foreground">
					No changes
				</div>
			)}
		</div>
	);
}

function statusDotClass(status: WorkingFileSummary["status"]) {
	switch (status) {
		case "added":
			return "bg-emerald-500";
		case "removed":
			return "bg-red-500";
		case "modified":
		default:
			return "bg-blue-500";
	}
}

function statusTextClass(status: WorkingFileSummary["status"]) {
	switch (status) {
		case "added":
			return "text-emerald-600";
		case "removed":
			return "text-red-600";
		case "modified":
		default:
			return "";
	}
}
