import IconSearch from "~icons/material-symbols/search-rounded"

const MarketplaceSearchBar = () => {
	const onSearch = () => {
		// TODO
		console.info("input")
	}

	return (
		<div class="flex justify-center gap-1 px-4 items-center border py-0.5 rounded-full transition-all bg-background border-surface-200 focus-within:border-primary">
			<input class="border-none focus:outline-none h-full pl-0" onChange={onSearch} />
			<IconSearch class="ml-3" />
		</div>
	)
}

export default MarketplaceSearchBar
