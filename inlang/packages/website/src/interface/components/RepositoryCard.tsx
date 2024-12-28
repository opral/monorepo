import Link from "#src/renderer/Link.jsx";
import { Show } from "solid-js";
/**
 * A card that displays a repository.
 */
export function RepositoryCard(props: {
	repository: {
		owner: string;
		repository: string;
		description: string;
		lastOpened?: number;
	};
	install?: boolean;
	modules?: string[];
}) {
	const getRelativeTime = (timestamp: number) => {
		// Calculate the time difference
		const currentTime = new Date().getTime();
		const timeDifference = currentTime - timestamp;

		// Create a new RelativeTimeFormat object for "en-US" locale
		const rtf = new Intl.RelativeTimeFormat("en-US");

		// Convert the time difference to relative time
		let relativeTime;

		if (timeDifference < 60000) {
			// Less than 1 minute
			relativeTime = "just now";
		} else if (timeDifference < 3600000) {
			// Less than 1 hour
			relativeTime = rtf.format(
				-Math.floor(timeDifference / (1000 * 60)),
				"minute"
			);
		} else if (timeDifference < 86400000) {
			// Less than 1 day
			relativeTime = rtf.format(
				-Math.floor(timeDifference / (1000 * 60 * 60)),
				"hour"
			);
		} else if (timeDifference < 2592000000) {
			// Less than 1 month
			relativeTime = rtf.format(
				-Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
				"day"
			);
		} else if (timeDifference < 31536000000) {
			// Less than 1 year
			relativeTime = rtf.format(
				-Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 30)),
				"month"
			);
		} else {
			// At least 1 year or more
			relativeTime = rtf.format(
				-Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365)),
				"year"
			);
		}
		return relativeTime;
	};

	return (
		<Link
			href={
				props.install
					? `/install?repo=github.com/${props.repository.owner}/${
							props.repository.repository
						}&module=${props.modules?.join(",")}`
					: `/editor/github.com/${props.repository.owner}/${props.repository.repository}`
			}
			class="rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors border border-surface-2 p-6 flex flex-col justify-between gap-5"
		>
			<div>
				<div class="flex flex-col">
					<div class="flex justify-between gap-4">
						<img
							class="w-10 h-10 rounded-md m-0 shadow-lg"
							src={`https://github.com/${props.repository.owner}.png?size=40`}
						/>
						<span class=" font-normal text-sm tracking-wide text-surface-500">
							{props.repository.lastOpened &&
								getRelativeTime(props.repository.lastOpened)}
						</span>
					</div>
					<p class="m-0 text-surface-900 font-semibold text-lg break-all pt-4">
						{props.repository.repository}
					</p>
					<p class="m-0 text-surface-500 font-normal text-sm break-all leading-6 tracking-wide">
						{props.repository.owner}
					</p>
				</div>
				{/* break all in case the repository name is too long */}
				<Show when={props.repository.description !== ""}>
					<p class="pt-6 font-normal leading-6 text-ellipsis w-full h-[72px] overflow-hidden text-sm tracking-wide text-surface-500">
						{props.repository.description}
					</p>
				</Show>
			</div>
		</Link>
	);
}
