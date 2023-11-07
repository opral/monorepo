import { Button } from "../components/Button.jsx"
import * as m from "#src/paraglide/messages.js"

const Lix = () => {
	return (
		<div class="w-full flex flex-col gap-4 md:py-0 bg-background rounded-2xl border border-surface-200 overflow-hidden lg:h-[330px]">
			<img
				class="flex-1 hidden lg:block w-full max-h-[260px] object-cover"
				src="./images/lixCoverV01.webp"
				alt="Lix Change Control"
			/>
			<img class="lg:hidden" src="./images/lixCoverV02.webp" alt="Lix Change Control" />
			<div class="flex flex-col md:flex-row items-start md:items-end px-8 pb-6 pt-3">
				<div class="flex flex-col gap-2 flex-1">
					<h1 class="text-md text-surface-700 font-semibold">{m.home_lix_title()}</h1>
					<p class="text-sm text-surface-500">{m.home_lix_description()}</p>
				</div>
				<Button
					type="textPrimary"
					href="https://github.com/inlang/monorepo/blob/ff2429c62ca5c4aa9443f18ca66f63249668784f/lix/design-principles.md#L1"
					class="-mb-[10px]"
				>
					{m.home_lix_button()}
				</Button>
			</div>
		</div>
	)
}

export default Lix
