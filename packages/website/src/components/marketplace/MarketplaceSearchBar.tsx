import IconSearch from "~icons/material-symbols/search-rounded"

const MarketplaceSearchBar = () => {
	const urlParams = new URLSearchParams(window.location.search)
	const searchParam = urlParams.get("search")

	const handleSubmit = () => {
		const search = document.getElementById("search") as HTMLInputElement
		const currentUrl = new URL(window.location.href)
		const newUrl = new URL(currentUrl.protocol + "//" + currentUrl.host + search.value)
		window.location.href = newUrl.href
		window.history.pushState({}, "", newUrl)
	}

	return (
		<form
			class="group flex justify-center gap-1 px-3 items-center border h-8 w-80 py-0.5 rounded-full transition-all bg-background border-surface-200 focus-within:border-primary"
			onSubmit={() => handleSubmit()}
		>
			<input
				type="text"
				id="search"
				name="search"
				class="border-0 focus:ring-0 h-full w-full pl-0 text-sm"
				value={searchParam?.replace(/%20/g, " ")}
			/>
			<button
				type="submit"
			>
				<IconSearch class="ml-1.5 group-focus-within:text-focus-primary" />
			</button>
		</form>
	)
}

export default MarketplaceSearchBar
