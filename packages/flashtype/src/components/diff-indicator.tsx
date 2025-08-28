type Props = {
	/**
	 * Number of lines/items added
	 */
	added: number;
	/**
	 * Number of lines/items removed/deleted
	 */
	removed: number;
	/**
	 * The threshold for maximum changes. When total changes reach this value,
	 * 4 bars will be shown. Below this, bars scale proportionally (1 bar per 25% of range).
	 * @default 100
	 */
	highRange?: number;
};

export function DiffIndicator({ added, removed, highRange = 100 }: Props) {
	const total = added + removed;

	// Calculate number of bars (1-4) based on percentage of highRange
	// Each bar represents 25% of the highRange
	let totalBars: number;
	if (total === 0) {
		totalBars = 0;
	} else if (total >= highRange) {
		totalBars = 4;
	} else {
		// Calculate bars: 1 bar per 25% of highRange, minimum 1 bar if there are any changes
		totalBars = Math.max(1, Math.ceil((total / highRange) * 4));
	}

	// Distribute bars between green and red proportionally
	// Ensure at least 1 bar of each color if both additions and deletions exist
	let greenBars = 0;
	let redBars = 0;

	if (totalBars > 0) {
		if (added > 0 && removed > 0) {
			// Both additions and deletions: ensure at least 1 of each
			if (totalBars === 1) {
				// Special case: show both colors even with 1 bar total
				greenBars = 1;
				redBars = 1;
			} else {
				// Proportional distribution with minimum 1 each
				const greenRatio = added / total;
				greenBars = Math.max(1, Math.round(greenRatio * totalBars));
				redBars = Math.max(1, totalBars - greenBars);

				// Adjust if total exceeds totalBars
				if (greenBars + redBars > totalBars) {
					if (greenRatio >= 0.5) {
						redBars = 1;
						greenBars = totalBars - 1;
					} else {
						greenBars = 1;
						redBars = totalBars - 1;
					}
				}
			}
		} else if (added > 0) {
			greenBars = totalBars;
		} else if (removed > 0) {
			redBars = totalBars;
		}
	}

	return (
		<div className="flex items-center gap-2 text-xs font-medium tabular-nums">
			<span className="text-green-600">+{added}</span>
			{removed > 0 ? <span className="text-red-600">-{removed}</span> : null}
			<span aria-hidden className="inline-flex items-center gap-0.5 pl-1 h-3">
				{Array.from({ length: greenBars }).map((_, i) => (
					<i
						key={`g${i}`}
						className="bg-green-500/90 block h-full w-0.5 rounded-sm"
					/>
				))}
				{Array.from({ length: redBars }).map((_, i) => (
					<i
						key={`r${i}`}
						className="bg-red-500/80 block h-full w-0.5 rounded-sm"
					/>
				))}
			</span>
		</div>
	);
}
