export const ListHeader = () => {
	return (
		<div class="h-16 w-full bg-background border border-surface-3 rounded-t-md flex items-center px-4 justify-between">
			<div class="font-medium text-on-surface">{24 + " Messages"}</div>
			<div>
				<sl-button>
					<div class="flex gap-2 items-center">
						<div class="-ml-2 h-7 px-2 rounded bg-danger/10 flex items-center justify-center">
							24
						</div>
						<p class="">missingMessage</p>
					</div>
				</sl-button>
			</div>
		</div>
	)
}
