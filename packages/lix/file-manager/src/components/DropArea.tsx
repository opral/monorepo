import { useCallback, useRef, useState, useEffect } from "react";
import { useAtom } from "jotai";
import { lixAtom } from "@/state.js";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.js";
import clsx from "clsx";
import { posthog } from "posthog-js";

export default function DropArea() {
	const dragCounter = useRef(0);
	const [isDragging, setIsDragging] = useState(false);
	const [lix] = useAtom(lixAtom);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			dragCounter.current = 0;
			setIsDragging(false);

			const files = Array.from(e.dataTransfer?.files ?? []);

			await lix.db.transaction().execute(async (trx) => {
				for (const file of files) {
					await trx
						.insertInto("file")
						.values({
							path: "/" + file.name,
							data: new Uint8Array(await file.arrayBuffer()),
							metadata:
								// hardcoded unique column for demo purposes
								file.name === "email-newsletter.csv"
									? {
											unique_column: "email",
										}
									: undefined,
						})
						.returningAll()
						.executeTakeFirstOrThrow();
					posthog.capture("File Imported", {
						fileName: file.name,
					});
				}
			});
			// setSearchParams({ f: result.id });

			await saveLixToOpfs({ lix });
		},
		[lix]
	);

	const handleDragEnter = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current += 1;
		if (dragCounter.current === 1) {
			setIsDragging(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current -= 1;
		if (dragCounter.current === 0) {
			setIsDragging(false);
		}
	}, []);

	useEffect(() => {
		document.addEventListener("dragenter", handleDragEnter);
		document.addEventListener("dragleave", handleDragLeave);
		document.addEventListener("dragover", (e) => e.preventDefault());
		document.addEventListener("drop", handleDrop);

		return () => {
			document.removeEventListener("dragenter", handleDragEnter);
			document.removeEventListener("dragleave", handleDragLeave);
			document.removeEventListener("dragover", (e) => e.preventDefault());
			document.removeEventListener("drop", handleDrop);
		};
	}, [handleDragEnter, handleDragLeave, handleDrop]);

	if (!isDragging) {
		return <div className="absolute inset-0 pointer-events-none" />;
	}

	return (
		<div className="absolute inset-0 z-50 bg-blue-50/10 transition-all duration-200">
			<div className="w-full h-full flex items-center justify-center backdrop-blur-[2px]">
				<div
					className={clsx(
						"w-[calc(100%-2rem)] h-[calc(100%-2rem)] m-4",
						"flex items-center justify-center",
						"border-2 border-dashed rounded-lg",
						"transition-all duration-200 ease-in-out"
					)}
				>
					<p className="text-zinc-500 font-medium">Drop files here</p>
				</div>
			</div>
		</div>
	);
}
