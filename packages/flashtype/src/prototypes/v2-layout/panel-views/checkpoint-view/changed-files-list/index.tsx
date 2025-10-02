type ChangedFile = {
	id: string;
	path: string;
};

type ChangedFilesListProps = {
	files: ChangedFile[];
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
	const allSelected = files.length > 0 && selectedFiles.size === files.length;

	return (
		<div className="flex flex-col gap-1 px-3 py-2">
			{/* Header with count and select all */}
			<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
				<span>
					Changed files {files.length}
				</span>
				<input
					type="checkbox"
					checked={allSelected}
					onChange={onToggleAll}
					aria-label="Select all files"
					className="h-3.5 w-3.5 cursor-pointer"
				/>
			</div>

			{/* File list */}
			<div className="flex flex-col">
				{files.map((file) => (
					<div
						key={file.id}
						className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50"
					>
						<div className="flex items-center gap-2">
							<div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
							<span className="text-foreground">{file.path}</span>
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
