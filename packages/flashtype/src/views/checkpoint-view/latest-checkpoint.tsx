import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type LatestCheckpointProps = {
	checkpoint?: {
		id: string;
		commit_id: string;
		checkpoint_created_at: string | null;
		added: number | null;
		removed: number | null;
	} | null;
	onViewHistory?: () => void;
};

export function LatestCheckpoint({
	checkpoint,
	onViewHistory,
}: LatestCheckpointProps) {
	const label = checkpoint ? "View all checkpoints" : "View checkpoints";
	const handleClick = () => {
		onViewHistory?.();
	};

	return (
		<div className="px-3 py-1.5">
			<button
				type="button"
				onClick={handleClick}
				className={cn(
					"inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
				)}
				disabled={!onViewHistory}
			>
				<span>{label}</span>
				<ArrowRight className="h-3 w-3" aria-hidden />
			</button>
		</div>
	);
}
