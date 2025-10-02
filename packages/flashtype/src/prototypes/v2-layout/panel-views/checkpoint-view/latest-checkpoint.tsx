type LatestCheckpointProps = {
	checkpoint?: {
		id: string;
		commit_id: string;
		checkpoint_created_at: string | null;
		added: number | null;
		removed: number | null;
	} | null;
};

export function LatestCheckpoint({ checkpoint }: LatestCheckpointProps) {
	if (!checkpoint) {
		return (
			<div className="px-3 py-1.5 text-[11px] text-muted-foreground">
				No checkpoints yet
			</div>
		);
	}

	// TODO: Add actual checkpoint message when available
	const placeholderMessage = "Previous checkpoint";

	return (
		<div className="px-3 py-1.5 text-[11px] text-muted-foreground">
			{placeholderMessage}
		</div>
	);
}
