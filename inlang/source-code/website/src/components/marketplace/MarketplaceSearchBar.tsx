import IconSearch from "~icons/material-symbols/search-rounded"

const MarketplaceSearchBar = () => {
	const onSearch = () => {
		// TODO
		console.info("input")
	}

	return (
		<div class="group flex justify-center gap-1 px-3 items-center border h-8 w-80 py-0.5 rounded-full transition-all bg-background border-surface-200 focus-within:border-primary">
			<input
				type="text"
				name="search"
				class="border-0 focus:ring-0 h-full w-full pl-0 text-sm"
				style={{ "outline-width": "0" }}
				onChange={onSearch} />
			<IconSearch class="ml-1.5 group-focus-within:text-focus-primary" />
		</div>
	)
}

export default MarketplaceSearchBar
