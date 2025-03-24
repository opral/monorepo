import { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import type { ChangeSetData } from "./change-set-context";

interface DiffViewProps {
	changeSet: ChangeSetData | undefined;
	onClose: () => void;
}

export function DiffView({ changeSet, onClose }: DiffViewProps) {
	const diffContentRef = useRef<HTMLDivElement>(null);

	// Render diff content when the change set changes
	useEffect(() => {
		if (diffContentRef.current && changeSet) {
			renderMockDiff(diffContentRef.current, changeSet);
		}
	}, [changeSet]);

	// Add keyboard event listener for Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	// Function to render mock diff content
	const renderMockDiff = (
		element: HTMLDivElement,
		changeSet: ChangeSetData,
	) => {
		// Clear the editor
		element.innerHTML = "";

		// Create a mock diff with highlighted text changes
		element.innerHTML = `
      <p>Hello world. <span class="bg-red-100 px-1">This is some texxt</span> <span class="bg-green-100 px-1">This is my first flow.</span></p>
      
      <p class="mt-4 text-sm text-gray-500">Changes by ${changeSet.author.name}:</p>
      <ul class="list-disc pl-5 mt-2 text-sm">
        ${changeSet.changes
					.map((change) => {
						const icon =
							change.type === "addition"
								? "+"
								: change.type === "deletion"
									? "-"
									: "~";
						const color =
							change.type === "addition"
								? "text-green-600"
								: change.type === "deletion"
									? "text-red-600"
									: "text-blue-600";
						return `<li class="${color}">${icon} ${change.description}</li>`;
					})
					.join("")}
      </ul>
    `;
	};

	return (
		<div className="flex flex-col flex-1">
			{/* Diff view banner */}
			<div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b h-9">
				<div className="font-medium text-sm">Difference</div>
				<Button
					size="sm"
					className="h-6 text-xs border rounded-sm px-2 py-0.5"
					onClick={onClose}
				>
					Exit
				</Button>
			</div>

			{/* Diff content */}
			<div
				ref={diffContentRef}
				className="p-3 flex-1 whitespace-pre-line outline-none bg-gray-50"
			/>
		</div>
	);
}
