import { useAtom } from "jotai";
import { isSyncingAtom, lixAtom, withPollingAtom } from "../state.ts";
import { useEffect, useState } from "react";
import {
	SlButton,
	SlDropdown,
	SlIcon,
	SlMenu,
	SlMenuItem,
} from "@shoelace-style/shoelace/dist/react";
import { Lix, toBlob } from "@lix-js/sdk";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";
import { openLixInMemory } from "@lix-js/sdk";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import { useNavigate } from "react-router-dom";
import { posthog } from "posthog-js";

export default function RootLayout(props: { children: JSX.Element }) {
	const [, setPolling] = useAtom(withPollingAtom);
	const [lix] = useAtom(lixAtom);
	const [isSyncing] = useAtom(isSyncingAtom);
	const navigate = useNavigate();

	useEffect(() => {
		const interval = setInterval(() => {
			setPolling(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN) {
			posthog.init(import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN, {
				api_host: "https://eu.i.posthog.com",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
			});
			posthog.capture("$pageview");
		} else {
			console.info("No posthog token found");
		}
		return () => posthog.reset();
	}, []);

	useEffect(() => {
		if (import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN) {
			posthog.init(import.meta.env.PUBLIC_LIX_POSTHOG_TOKEN, {
				api_host: "https://eu.i.posthog.com",
				capture_performance: false,
				autocapture: {
					capture_copied_text: true,
				},
			});
			posthog.capture("$pageview");
		} else {
			console.info("No posthog token found");
		}
		return () => posthog.reset();
	}, []);

	const handleOpenLixFile = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const fileContent = await file.arrayBuffer();
			const opfsRoot = await navigator.storage.getDirectory();
			const lix = await openLixInMemory({
				blob: new Blob([fileContent]),
				providePlugins: [csvPlugin],
			});
			const lixId = await lix.db
				.selectFrom("key_value")
				.where("key", "=", "lix_id")
				.select("value")
				.executeTakeFirstOrThrow();

			const opfsFile = await opfsRoot.getFileHandle(`${lixId.value}.lix`, {
				create: true,
			});
			const writable = await opfsFile.createWritable();
			await writable.write(fileContent);
			await writable.close();
			navigate("?lix=" + lixId.value);
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
									onChange={handleOpenLixFile}
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
									try {
										const root = await navigator.storage.getDirectory();
										// @ts-expect-error - TS doesn't know about values() yet
										for await (const entry of root.values()) {
											if (entry.kind === "file") {
												await root.removeEntry(entry.name);
											}
										}
										navigate("/");
										console.log("All files deleted from OPFS.");
									} catch (error) {
										console.error("Error deleting files from OPFS:", error);
									}
								}}
							>
								<SlIcon
									name="arrow-counterclockwise"
									slot="prefix"
									className="mr-2"
								></SlIcon>
								Reset OPFS
							</SlMenuItem>
						</SlMenu>
					</SlDropdown>
					{isSyncing && <SyncStatus lix={lix}></SyncStatus>}
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
	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	const blob = await toBlob({ lix });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = `${lixId.value}.lix`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

function SyncAndShare() {
	return <SyncButton></SyncButton>;
}

function SyncButton() {
	const [isSyncing] = useAtom(isSyncingAtom);
	const [lix] = useAtom(lixAtom);

	if (!isSyncing) {
		return (
			<SlButton
				variant="success"
				size="small"
				className=""
				onClick={async () => {
					await lix.db
						.updateTable("key_value")
						.set({
							value: "true",
						})
						.where("key", "=", "lix_sync")
						.execute();

					await saveLixToOpfs({ lix });
				}}
			>
				Sync
			</SlButton>
		);
	}
}

function SyncStatus(props: { lix: Lix }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="flex gap-3 items-center hover:cursor-pointer"
			onClick={() => {
				props.lix.db
					.updateTable("key_value")
					.where("key", "=", "lix_sync")
					.set({ value: "false" })
					.execute();
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div
				className={`w-3 h-3 rounded-4xl ${isHovered ? "bg-red-700" : "bg-green-700"}`}
			></div>
			<p className="">{isHovered ? "Stop syncing" : "Syncing"}</p>
		</div>
	);
}