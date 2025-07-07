import { Clock, AlertTriangle, Activity } from "lucide-react";

interface PerformanceMetricsProps {
	metrics: {
		avgDuration: number;
		slowQueries: number;
		totalQueries: number;
	};
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
	return (
		<div className="grid grid-cols-3 gap-4">
			<div className="stat bg-base-200 rounded p-3">
				<div className="stat-figure text-primary">
					<Clock className="h-5 w-5" />
				</div>
				<div className="stat-title text-xs">Avg Duration</div>
				<div className="stat-value text-sm">{metrics.avgDuration}ms</div>
			</div>

			<div className="stat bg-base-200 rounded p-3">
				<div className="stat-figure text-warning">
					<AlertTriangle className="h-5 w-5" />
				</div>
				<div className="stat-title text-xs">Slow Queries</div>
				<div className="stat-value text-sm">{metrics.slowQueries}</div>
				<div className="stat-desc text-xs">&gt; 100ms</div>
			</div>

			<div className="stat bg-base-200 rounded p-3">
				<div className="stat-figure text-success">
					<Activity className="h-5 w-5" />
				</div>
				<div className="stat-title text-xs">Total Queries</div>
				<div className="stat-value text-sm">{metrics.totalQueries}</div>
			</div>
		</div>
	);
}