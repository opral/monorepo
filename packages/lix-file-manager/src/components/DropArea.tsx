import { useCallback, useRef, useState, useEffect } from "react";
import { useAtom } from "jotai";
import { lixAtom } from "@/state.js";
import { fileIdSearchParamsAtom, withPollingAtom } from "@/state.js";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.js";
import clsx from "clsx";

export default function DropArea() {
	const dragCounter = useRef(0);
	const [isDragging, setIsDragging] = useState(false);
	const [lix] = useAtom(lixAtom);
	const [, setFileIdSearchParams] = useAtom(fileIdSearchParamsAtom);
	const [, setWithPolling] = useAtom(withPollingAtom);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			dragCounter.current = 0;
			setIsDragging(false);

			const files = Array.from(e.dataTransfer?.files || []);
			let lastInsertId: string | undefined;

			for (const file of files) {
				const result = await lix.db
					.insertInto("file")
					.values({
						path: "/" + file.name,
						data: await file.arrayBuffer(),
					})
					.executeTakeFirst();

				if (result && result.insertId) {
					lastInsertId = String(result.insertId);
				}
			}

			await saveLixToOpfs({ lix });
			setWithPolling(Date.now());

			// Wait for a tick to ensure DB operations are complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			if (lastInsertId) {
				// Get the latest file data
				const file = await lix.db
					.selectFrom("file")
					.where("id", "=", lastInsertId)
					.selectAll()
					.executeTakeFirst();

				if (file) {
					setFileIdSearchParams(lastInsertId);
				}
			}
		},
		[lix, setFileIdSearchParams, setWithPolling]
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
