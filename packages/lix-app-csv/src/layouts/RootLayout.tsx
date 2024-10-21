import { useAtom } from "jotai";
import { withPollingAtom } from "../state.ts";
import { useEffect } from "react";

export default function RootLayout(props: { children: JSX.Element }) {
	const [, setPolling] = useAtom(withPollingAtom);

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			{/* Header with socials */}
			<div className="w-full border-b border-zinc-200 bg-white flex items-center justify-between px-4 min-h-[54px] gap-2">
				<div className="flex gap-2 items-center">
					<a href="https://lix.opral.com" target="_blank">
						<img src="/lix.svg" alt="logo" className="w-8 h-8" />
					</a>
					<h1 className="font-medium">CSV Demo</h1>
				</div>
				<div className="flex gap-3 items-center">
					<a href="https://discord.gg/gdMPPWy57R" target="_blank">
						<img src="/discord-icon.svg" alt="logo" className="w-6 h-6" />
					</a>
					<a href="https://x.com/lixCCS" target="_blank">
						<img src="/x-icon.svg" alt="logo" className="w-5 h-5" />
					</a>
					<a href="https://github.com/opral/monorepo" target="_blank">
						<img src="/github-icon.svg" alt="logo" className="w-5 h-5" />
					</a>
				</div>
			</div>
			{props.children}
		</>
	);
}
