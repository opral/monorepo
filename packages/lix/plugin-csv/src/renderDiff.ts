import type { RenderDiffArgs } from "@lix-js/sdk";
import { CellSchemaV1 } from "./schemas/cell.js";
import { HeaderSchemaV1 } from "./schemas/header.js";
import { RowSchemaV1 } from "./schemas/row.js";

type DiffEntry = RenderDiffArgs["diffs"][number];

type CellSnapshot = { text?: string; rowId?: string } | null;
type RowSnapshot = { lineNumber?: number } | null;
type HeaderSnapshot = { columnNames?: string[] } | null;

const HEADER_KEY = HeaderSchemaV1["x-lix-key"] as string;
const CELL_KEY = CellSchemaV1["x-lix-key"] as string;
const ROW_KEY = RowSchemaV1["x-lix-key"] as string;

/**
 * Render the CSV plugin diff as HTML markup.
 *
 * @example
 * const html = await renderDiff({ diffs })
 * container.innerHTML = html
 */
export async function renderDiff({ diffs }: RenderDiffArgs): Promise<string> {
	if (!diffs.length) {
		return "";
	}

	const headerDiff = diffs.find((diff) => diff.schema_key === HEADER_KEY);
	const rowGroups = new Map<string, DiffEntry[]>();

	for (const diff of diffs) {
		if (diff.schema_key === HEADER_KEY) continue;

		const rowId = resolveRowId(diff);
		if (!rowId) continue;

		if (!rowGroups.has(rowId)) {
			rowGroups.set(rowId, []);
		}

		rowGroups.get(rowId)!.push(diff);
	}

	const headerSection = headerDiff ? renderHeaderDiff(headerDiff) : "";

	const rowsSection = Array.from(rowGroups.entries())
		.map(([rowId, entries]) => renderRowDiff(rowId, entries))
		.join("");

	const content = [headerSection, rowsSection].filter(Boolean).join("");

	return content ? `${styles()}<div class="lix-csv-diff">${content}</div>` : "";
}

function renderRowDiff(rowId: string, diffs: DiffEntry[]): string {
	const [, uniqueValue = rowId] = rowId.split("|");
	const changes = diffs.map((diff) => renderRowChange(rowId, diff)).join("");

	return `
		<section class="lix-csv-diff__row">
			<div class="lix-csv-diff__header">
				<span class="lix-csv-diff__label">Unique Value</span>
				<span class="lix-csv-diff__pill">${escapeHtml(uniqueValue)}</span>
			</div>
			<div class="lix-csv-diff__changes">
				${changes || `<span class="lix-csv-diff__empty">No column level changes</span>`}
			</div>
		</section>
	`;
}

function renderRowChange(rowId: string, diff: DiffEntry): string {
	if (diff.schema_key === ROW_KEY) {
		const beforeLine = ((diff.before_snapshot_content ?? null) as RowSnapshot)
			?.lineNumber;
		const afterLine = ((diff.after_snapshot_content ?? null) as RowSnapshot)
			?.lineNumber;

		return `
			<div class="lix-csv-diff__row-change">
				<span class="lix-csv-diff__label">Row Position</span>
				<div class="lix-csv-diff__values">
					<span class="lix-csv-diff__box">${formatOrdinal(beforeLine)}</span>
					<span class="lix-csv-diff__arrow" aria-hidden="true">→</span>
					<span class="lix-csv-diff__box">${formatOrdinal(afterLine)}</span>
				</div>
			</div>
		`;
	}

	if (diff.schema_key !== CELL_KEY) {
		return "";
	}

	const column = diff.entity_id.startsWith(rowId)
		? diff.entity_id.slice(rowId.length + 1)
		: (diff.entity_id.split("|")[2] ?? diff.entity_id);

	const afterSnapshot = (diff.after_snapshot_content ?? null) as CellSnapshot;
	const beforeSnapshot = (diff.before_snapshot_content ?? null) as CellSnapshot;

	return `
		<div class="lix-csv-diff__cell-change">
			<span class="lix-csv-diff__label">${escapeHtml(column)}</span>
			<div class="lix-csv-diff__values">
				${renderValueBox(afterSnapshot?.text, "Added value")}
				<span class="lix-csv-diff__arrow" aria-hidden="true">→</span>
				${renderValueBox(beforeSnapshot?.text, "Previous value")}
			</div>
		</div>
	`;
}

function renderValueBox(value: string | undefined, ariaLabel: string): string {
	if (value === undefined || value === null || value === "") {
		return `<span class="lix-csv-diff__box lix-csv-diff__box--empty" aria-label="${escapeHtml(ariaLabel)} (empty)">—</span>`;
	}

	return `<span class="lix-csv-diff__box" aria-label="${escapeHtml(ariaLabel)}">${escapeHtml(value)}</span>`;
}

function renderHeaderDiff(diff: DiffEntry): string {
	const beforeSnapshot = (diff.before_snapshot_content ??
		null) as HeaderSnapshot;
	const afterSnapshot = (diff.after_snapshot_content ?? null) as HeaderSnapshot;
	const beforeColumns = beforeSnapshot?.columnNames ?? [];
	const afterColumns = afterSnapshot?.columnNames ?? [];

	return `
		<section class="lix-csv-diff__row lix-csv-diff__row--header">
			<div class="lix-csv-diff__header">
				<span class="lix-csv-diff__label">Header</span>
			</div>
			<div class="lix-csv-diff__values lix-csv-diff__values--stacked">
				<div>
					<span class="lix-csv-diff__subheading">After</span>
					${renderColumnList(afterColumns)}
				</div>
				<div>
					<span class="lix-csv-diff__subheading">Before</span>
					${renderColumnList(beforeColumns)}
				</div>
			</div>
		</section>
	`;
}

function renderColumnList(columns: string[]): string {
	if (columns.length === 0) {
		return `<span class="lix-csv-diff__box lix-csv-diff__box--empty">No columns</span>`;
	}

	return `<ul class="lix-csv-diff__column-list">${columns
		.map((column) => `<li>${escapeHtml(column)}</li>`)
		.join("")}</ul>`;
}

function resolveRowId(diff: DiffEntry): string | undefined {
	const afterRowId = ((diff.after_snapshot_content ?? null) as CellSnapshot)
		?.rowId;
	if (afterRowId) return afterRowId;

	const beforeRowId = ((diff.before_snapshot_content ?? null) as CellSnapshot)
		?.rowId;
	if (beforeRowId) return beforeRowId;

	const [uniqueColumn, uniqueValue] = diff.entity_id.split("|");
	if (uniqueColumn && uniqueValue) {
		return `${uniqueColumn}|${uniqueValue}`;
	}

	return undefined;
}

function formatOrdinal(value: number | undefined): string {
	if (value === undefined || Number.isNaN(value)) {
		return "—";
	}

	return `${value + 1}`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function styles(): string {
	return `
		<style>
			.lix-csv-diff {
				display: grid;
				gap: 1rem;
				font-family: system-ui, sans-serif;
				color: var(--lix-diff-foreground, #0f172a);
			}

			.lix-csv-diff__row {
				display: flex;
				flex-direction: column;
				gap: 0.75rem;
				padding: 0.75rem 1rem;
				border: 1px solid var(--lix-diff-border, #e2e8f0);
				border-radius: 0.75rem;
				background: var(--lix-diff-surface, #ffffff);
			}

			.lix-csv-diff__row--header {
				background: var(--lix-diff-surface-muted, #f8fafc);
			}

			.lix-csv-diff__header {
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}

			.lix-csv-diff__label {
				font-size: 0.75rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: var(--lix-diff-muted, #64748b);
			}

			.lix-csv-diff__pill {
				display: inline-flex;
				align-items: center;
				padding: 0.25rem 0.75rem;
				border-radius: 9999px;
				border: 1px solid var(--lix-diff-border, #e2e8f0);
				background: var(--lix-diff-surface, #ffffff);
				font-weight: 600;
			}

			.lix-csv-diff__changes {
				display: grid;
				gap: 0.75rem;
			}

			.lix-csv-diff__row-change,
			.lix-csv-diff__cell-change {
				display: flex;
				flex-direction: column;
				gap: 0.5rem;
			}

			.lix-csv-diff__values {
				display: inline-flex;
				align-items: center;
				gap: 0.5rem;
				flex-wrap: wrap;
			}

			.lix-csv-diff__values--stacked {
				display: grid;
				gap: 0.75rem;
			}

			.lix-csv-diff__subheading {
				display: block;
				font-size: 0.75rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: var(--lix-diff-muted, #64748b);
				margin-bottom: 0.25rem;
			}

			.lix-csv-diff__box {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 3rem;
				padding: 0.25rem 0.75rem;
				border-radius: 0.5rem;
				border: 1px solid var(--lix-diff-border, #e2e8f0);
				background: var(--lix-diff-surface, #ffffff);
				font-family: ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
			}

			.lix-csv-diff__box--empty {
				color: var(--lix-diff-muted, #94a3b8);
				border-style: dashed;
				background: transparent;
			}

			.lix-csv-diff__arrow {
				color: var(--lix-diff-muted, #94a3b8);
				font-size: 0.875rem;
			}

			.lix-csv-diff__column-list {
				margin: 0;
				padding-left: 1rem;
				font-family: inherit;
			}

			.lix-csv-diff__column-list li {
				margin: 0.25rem 0;
			}

			.lix-csv-diff__empty {
				color: var(--lix-diff-muted, #94a3b8);
			}
		</style>
	`;
}
