import IconSearch from "~icons/material-symbols/search-rounded"
import { currentPageContext } from "#src/renderer/state.js"
import { createSignal } from "solid-js"
import { navigate } from "vite-plugin-ssr/client/router"

const SearchBar = () => {
	const [searchInput, setSearchInput] = createSignal<string>("")
	const { q } = currentPageContext.urlParsed.search
	const { category } = currentPageContext.routeParams

	return (
		<form
			class="group flex justify-center gap-1 px-3 items-center border h-8 w-full py-0.5 rounded-full transition-all duration-150 bg-background border-surface-200 focus-within:border-primary"
			onSubmit={(e) => {
				e.preventDefault()
				if (!category) {
					// !TODO write helper function for that
					if (searchInput() !== "") window.history.pushState({}, "", "/search?q=" + searchInput())
					if (searchInput() === "") navigate("/search")
					else navigate("/search?q=" + searchInput())
				} else {
					if (searchInput() !== "")
						window.history.pushState({}, "", "/c/" + category + "?q=" + searchInput())
					if (searchInput() === "") navigate("/c/" + category)
					else navigate("/c/" + category + "?q=" + searchInput())
				}
			}}
		>
			<input
				type="text"
				aria-label="search input"
				id="search"
				name="search"
				class="border-0 focus:ring-0 h-full w-full pl-0 text-sm"
				value={q ? q : searchInput()}
				onInput={(e) => {
					setSearchInput(e.target.value)
				}}
			/>
			<button type="submit" aria-label="submit search">
				<IconSearch class="ml-1.5 transition-color duration-150 group-focus-within:text-primary" />
			</button>
		</form>
	)
}

export default SearchBar
