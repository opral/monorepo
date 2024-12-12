import { useAtom } from "jotai";
import {
	LIX_FILE_NAME,
	lixAtom,
	serverUrlAtom,
	withPollingAtom,
} from "../state.ts";
import { useEffect, useState } from "react";
import {
	SlButton,
	SlDropdown,
	SlIcon,
	SlMenu,
	SlMenuItem,
} from "@shoelace-style/shoelace/dist/react";
import { Lix } from "@lix-js/sdk";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";

export default function RootLayout(props: { children: JSX.Element }) {
	const [, setPolling] = useAtom(withPollingAtom);
	const [lix] = useAtom(lixAtom);
	const [serverUrl] = useAtom(serverUrlAtom);

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			// Handle the file here
			const fileContent = await file.arrayBuffer();

			const opfsRoot = await navigator.storage.getDirectory();
			const opfsFile = await opfsRoot.getFileHandle(LIX_FILE_NAME, {
				create: true,
			});
			const writable = await opfsFile.createWritable();
			await writable.write(fileContent);
			await writable.close();
			window.location.reload();
		}
	};

	return (
		<>
			{/* Header with socials */}
			<div className="w-full border-b border-zinc-200 bg-white flex items-center justify-between px-4 min-h-[54px] gap-2">
				<div className="flex gap-2 items-center">
					<div className="flex gap-2 items-center">
						<a href="/">
							<img src="/lix.svg" alt="logo" className="w-8 h-8" />
						</a>
						<h1 className="font-medium">CSV Demo</h1>
					</div>

					<SlDropdown>
						<SlButton slot="trigger" caret size="small">
							Options
						</SlButton>
						<SlMenu>
							<SlMenuItem
								onClick={() => document.getElementById("file-input")?.click()}
							>
								<SlIcon
									name="file-earmark"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Open
								<input
									id="file-input"
									type="file"
									style={{ display: "none" }}
									onChange={handleFileSelect}
								></input>
							</SlMenuItem>
							<SlMenuItem onClick={() => handleExportLixFile(lix)}>
								<SlIcon
									name="file-arrow-down"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Export
							</SlMenuItem>
							<SlMenuItem
								onClick={async () => {
									// @ts-expect-error - globally defined
									await window.deleteLix();
									window.location.reload();
								}}
							>
								<SlIcon
									name="arrow-counterclockwise"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Reset
							</SlMenuItem>
						</SlMenu>
					</SlDropdown>
					{serverUrl && (
						<SyncStatus serverUrl={serverUrl} lix={lix}></SyncStatus>
					)}
					<SyncAndShare />
				</div>
				<div className="flex gap-3 items-center">
					<a href="https://github.com/opral/monorepo" target="_blank">
						<img src="/github-icon.svg" alt="logo" className="w-5 h-5" />
					</a>
					<a href="https://discord.gg/gdMPPWy57R" target="_blank">
						<img
							src="/discord-icon.svg"
							alt="logo"
							className="w-6 h-6 filter grayscale"
						/>
					</a>
					<a href="https://x.com/lixCCS" target="_blank">
						<img src="/x-icon.svg" alt="logo" className="w-5 h-5" />
					</a>
				</div>
			</div>
			{props.children}
		</>
	);
}

const handleExportLixFile = async (lix: Lix) => {
	const blob = await lix.toBlob();
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "demo.lix";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

function SyncAndShare() {
	return <SyncButton></SyncButton>;
}

function SyncButton() {
	const [serverUrl] = useAtom(serverUrlAtom);
	const [lix] = useAtom(lixAtom);

	if (!serverUrl) {
		return (
			<SlButton
				variant="success"
				size="small"
				className=""
				onClick={async () => {
					const response = await fetch(
						new Request(`http://localhost:3000/lsa/new-v1`, {
							method: "POST",
							body: await lix.toBlob(),
						})
					);

					// if it's a 409, then the lix already exists on the server
					// and will start to sync
					if (response.ok === false && response.status !== 409) {
						throw new Error(`Failed to send lix to server: ${response.status}`);
					}

					await lix.db
						.insertInto("key_value")
						.values({
							key: "lix_experimental_server_url",
							value: "http://localhost:3000",
						})
						.execute();

					await saveLixToOpfs({ lix });
				}}
			>
				Sync
			</SlButton>
		);
	}
}

function SyncStatus(props: { serverUrl: string; lix: Lix }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="flex gap-3 items-center hover:cursor-pointer"
			onClick={() => {
				props.lix.db
					.deleteFrom("key_value")
					.where("key", "=", "lix_experimental_server_url")
					.execute();
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div
				className={`w-3 h-3 rounded-4xl ${isHovered ? "bg-red-700" : "bg-green-700"}`}
			></div>
			<p className="">
				{isHovered ? "Stop syncing to" : "Syncing to"} {props.serverUrl}
			</p>
		</div>
	);
}