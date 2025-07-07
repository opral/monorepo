import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface QueryDetailsProps {
	log: {
		id: string;
		message: string;
		payload?: {
			sql: string;
			bindings: any[];
			duration_ms: number;
			result_count: number;
			query_type: string;
			subscription_id?: string;
			timestamp: string;
		};
		lixcol_created_at: string;
	};
}

export default function QueryDetails({ log }: QueryDetailsProps) {
	const [copiedSql, setCopiedSql] = useState(false);
	const [copiedBindings, setCopiedBindings] = useState(false);

	if (!log.payload) {
		return null;
	}

	const copyToClipboard = async (text: string, type: "sql" | "bindings") => {
		try {
			await navigator.clipboard.writeText(text);
			if (type === "sql") {
				setCopiedSql(true);
				setTimeout(() => setCopiedSql(false), 2000);
			} else {
				setCopiedBindings(true);
				setTimeout(() => setCopiedBindings(false), 2000);
			}
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div className="bg-base-200/50 p-4 border-t">
			<div className="space-y-3">
				{/* SQL Query */}
				<div>
					<div className="flex items-center justify-between mb-1">
						<span className="text-xs font-semibold">SQL Query</span>
						<button
							className="btn btn-xs btn-ghost"
							onClick={() => copyToClipboard(log.payload!.sql, "sql")}
						>
							{copiedSql ? (
								<Check className="h-3 w-3 text-success" />
							) : (
								<Copy className="h-3 w-3" />
							)}
							Copy
						</button>
					</div>
					<pre className="text-xs bg-base-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
						{log.payload.sql}
					</pre>
				</div>

				{/* Bindings */}
				{log.payload.bindings && log.payload.bindings.length > 0 && (
					<div>
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs font-semibold">Bindings</span>
							<button
								className="btn btn-xs btn-ghost"
								onClick={() =>
									copyToClipboard(
										JSON.stringify(log.payload!.bindings, null, 2),
										"bindings"
									)
								}
							>
								{copiedBindings ? (
									<Check className="h-3 w-3 text-success" />
								) : (
									<Copy className="h-3 w-3" />
								)}
								Copy
							</button>
						</div>
						<pre className="text-xs bg-base-100 p-2 rounded overflow-x-auto">
							{JSON.stringify(log.payload.bindings, null, 2)}
						</pre>
					</div>
				)}

				{/* Metadata */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
					<div>
						<span className="font-semibold">Duration:</span>{" "}
						<span className={log.payload.duration_ms > 100 ? "text-warning" : ""}>
							{log.payload.duration_ms}ms
						</span>
					</div>
					<div>
						<span className="font-semibold">Results:</span>{" "}
						{log.payload.result_count} rows
					</div>
					<div>
						<span className="font-semibold">Type:</span>{" "}
						<span className="badge badge-xs">{log.payload.query_type}</span>
					</div>
					{log.payload.subscription_id && (
						<div>
							<span className="font-semibold">Subscription:</span>{" "}
							<span className="font-mono">{log.payload.subscription_id}</span>
						</div>
					)}
				</div>

				{/* Timestamp */}
				<div className="text-xs text-gray-500">
					<span className="font-semibold">Timestamp:</span>{" "}
					{new Date(log.payload.timestamp).toLocaleString()}
				</div>
			</div>
		</div>
	);
}