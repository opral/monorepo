import { Button } from "../components/Button.jsx"

const Lix = () => {
	return (
		<div class="w-full flex flex-col gap-4 md:py-0 bg-background rounded-2xl border border-surface-200 overflow-hidden lg:h-[330px]">
			<div class="flex-1 w-full hidden lg:block lg:bg-[url('./images/lixCoverV01.png')] bg-cover bg-center" />
			<img class="lg:hidden" src="./images/lixCoverV02.png" alt="Lix Change Control" />
			<div class="flex flex-col md:flex-row items-start md:items-end px-8 pb-6 pt-3">
				<div class="flex flex-col gap-2 flex-1">
					<h1 class="text-md text-surface-700 font-semibold">Lix change control</h1>
					<p class="text-sm text-surface-500">⏱️ The backbone of the ecosystem</p>
				</div>
				<Button type="textPrimary" href="/">
					{"More about Lix >"}
				</Button>
			</div>
		</div>
	)
}

export default Lix
