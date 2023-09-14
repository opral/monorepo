import { createSignal } from "solid-js"
import { Icon } from "#src/components/Icon.jsx"
import MaterialSymbolsChevronLeft from "~icons/material-symbols/chevron-left"
import MaterialSymbolsChevronRight from "~icons/material-symbols/chevron-right"

export const Errors = (props: { errors: Array<any>; message: string; messagePlural: string }) => {
	const [visibleError, setVisibleError] = createSignal(0)
	return (
		<div class="w-full h-full flex flex-col items-center justify-center gap-16">
			<div class="pt-24 md:w-[600px] mx-auto">
				<div class="flex md:w-[600px] items-center gap-4 justify-between pb-4">
					{props.errors.length === 1 ? (
						<p class="text-lg font-medium">{props.message}</p>
					) : (
						<>
							<p class="text-lg font-medium">
								{props.errors.length} {props.messagePlural}
							</p>
							<sl-button-group>
								<sl-button
									prop:size="small"
									onClick={() => {
										setVisibleError((prev) => {
											if (prev !== 0) {
												return prev - 1
											}
											return prev
										})
									}}
								>
									{/* @ts-ignore */}
									<MaterialSymbolsChevronLeft class="w-6 h-6" slot="prefix" />
								</sl-button>
								<sl-button
									prop:size="small"
									onClick={() => {
										setVisibleError((prev) => {
											if (prev + 1 !== props.errors.length) {
												return prev + 1
											}
											return prev
										})
									}}
								>
									{/* @ts-ignore */}
									<MaterialSymbolsChevronRight class="w-6 h-6" slot="prefix" />
								</sl-button>
							</sl-button-group>
						</>
					)}
				</div>
				{props.errors.length !== 0 && (
					<div class="pt-2 md:w-[600px]">
						<div class="bg-danger text-background p-4 rounded-md flex items-center gap-4 mb-8">
							<Icon name="danger" class="w-7 h-7 flex-shrink-0" />
							<div>
								<span class="font-semibold">{props.errors[visibleError()]?.name}: </span>
								<br />
								{/* @ts-ignore */}
								{props.errors[visibleError()]?.message}
							</div>
						</div>
						{/* @ts-ignore */}
						{props.errors[visibleError()]?.cause && props.errors[visibleError()]?.cause.message && (
							<>
								<p class="text-surface-500 text-sm mb-1">Error cause</p>
								<div class="font-mono p-4 bg-surface-800 text-background rounded-md text-sm mb-8">
									<p>
										<span class="font-semibold text-hover-danger">{"> "}</span>
										{/* @ts-ignore */}
										{props.errors[visibleError()]?.cause.message}
									</p>
								</div>
							</>
						)}
						{/* @ts-ignore */}
						{props.errors[visibleError()]?.stack && (
							<>
								<p class="text-surface-500 text-sm mb-1">Stack trace</p>
								<div class="font-mono p-4 bg-surface-800 text-background rounded-md text-sm mb-8 break-words">
									<p>
										<span class="font-semibold text-hover-danger">{"> "}</span>
										{/* @ts-ignore */}
										{props.errors[visibleError()]?.stack}
									</p>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
