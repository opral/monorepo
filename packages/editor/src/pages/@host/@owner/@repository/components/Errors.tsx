import { createSignal } from "solid-js"
import { Icon } from "#src/interface/components/Icon.jsx"
import MaterialSymbolsChevronLeft from "~icons/material-symbols/chevron-left"
import MaterialSymbolsChevronRight from "~icons/material-symbols/chevron-right"

export const Errors = (props: { errors: Array<any>; message: string; messagePlural: string }) => {
	const [visibleError, setVisibleError] = createSignal(0)
	return (
		<div class="w-full h-full flex flex-col min-h-[calc(100vh_-_319px)] items-center justify-center gap-16">
			<div class="pt-12 sm:pt-0 w-full sm:w-[600px] mx-auto">
				<div class="flex sm:w-[600px] items-center gap-4 justify-between pb-4">
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
					<div class="pt-2 sm:w-[600px]">
						<div class="bg-danger text-background p-4 rounded-md flex items-center gap-4 mb-8">
							<Icon name="danger" class="w-7 h-7 flex-shrink-0" />
							<div>
								<span class="font-semibold break-all">{props.errors[visibleError()]?.name}: </span>
								<br />
								{props.errors[visibleError()]?.message}
							</div>
						</div>
						{props.errors[visibleError()]?.cause && props.errors[visibleError()]?.cause.message && (
							<>
								<p class="text-surface-500 text-sm mb-1">Error cause</p>
								<div class="font-mono p-4 bg-surface-800 text-background rounded-md text-sm mb-8">
									<p>
										<span class="font-semibold text-hover-danger">{"> "}</span>
										{props.errors[visibleError()]?.cause.message}
									</p>
								</div>
							</>
						)}
						{props.errors[visibleError()]?.stack && (
							<>
								<p class="text-surface-500 text-sm mb-1">Stack trace</p>
								<div class="font-mono p-4 bg-surface-800 text-background rounded-md text-sm mb-8 break-words">
									<p>
										<span class="font-semibold text-hover-danger">{"> "}</span>
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
