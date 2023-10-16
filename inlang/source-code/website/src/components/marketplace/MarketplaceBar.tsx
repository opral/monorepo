// import { serialize } from '@shoelace-style/shoelace/dist/utilities/form.js';
import IconSearch from "~icons/material-symbols/search-rounded"

const MarketplaceBar = () => {
	return (
		<form
			class="flex justify-center items-center gap-2"
		// justify-center items-center gap-1 border px-1.5 py-[5px] rounded-full transition-all bg-background border-surface-200"
		>
			<sl-input class="border-none p-0" />
			<sl-button prop:type="submit" prop:variant="primary">
				{/* @ts-ignore */}
				<IconSearch class="w-6 h-6 -mx-1" slot="prefix" />
			</sl-button>
		</form>
	)
}

export default MarketplaceBar
