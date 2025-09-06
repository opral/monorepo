import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { serializeToHtml } from "@opral/markdown-wc/html";
import { renderHtmlDiff } from "@lix-js/html-diff";
import { AstSchemas, type MarkdownNode, type Ast } from "@opral/markdown-wc";

/**
 * Minimal Diff UI Component for Markdown-WC (v2 plugin)
 *
 * For now: render the before and after HTML blocks beneath each other (no diffing).
 * Later we will embed @lix-js/html-diff to render inline diffs like v1.
 */
export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			--border: 1px solid hsl(0 0% 90%);
			--radius: 8px;
			--bg: white;
			--muted: hsl(0 0% 40%);
			display: block;
		}

		/* HTML diff styles (inline to work inside Shadow DOM) */
		.diff-added {
			color: var(--lix-diff-added-color, #1f883d);
		}
		.diff-modified {
			color: var(--lix-diff-modified-color, #f59e0b);
		}
		.diff-removed {
			color: var(--lix-diff-removed-color, #d1242f);
		}

		/* Word-level highlights: soft background and subtle rounding */
		[data-diff-mode="words"] .diff-added,
		[data-diff-mode="words"] .diff-removed,
		[data-diff-mode="words"] .diff-modified {
			padding: 0 0.18em;
			border-radius: 4px;
		}
		[data-diff-mode="words"] .diff-added {
			background: #ebf7ef;
			background: color-mix(
				in srgb,
				var(--lix-diff-added-color, #1f883d) 12%,
				transparent
			);
		}
		[data-diff-mode="words"] .diff-removed {
			background: #fdecec;
			background: color-mix(
				in srgb,
				var(--lix-diff-removed-color, #d1242f) 12%,
				transparent
			);
			text-decoration: line-through;
		}
		[data-diff-mode="words"] .diff-modified {
			background: #fff3dc;
			background: color-mix(
				in srgb,
				var(--lix-diff-modified-color, #f59e0b) 14%,
				transparent
			);
		}
		.wrap {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.panel {
			border: var(--border);
			border-radius: var(--radius);
			background: var(--bg);
			padding: 10px 12px;
		}
		.label {
			font-size: 12px;
			color: var(--muted);
			margin-bottom: 6px;
		}
		.content :where(p) {
			margin: 6px 0;
		}
	`;

	@property({ type: Array }) diffs: UiDiffComponentProps["diffs"] = [];
	private _beforeHtml = "";
	private _afterHtml = "";
	private _diffHtml = "";

	override async updated(changed: Map<string, unknown>) {
		if (changed.has("diffs")) {
			await this.computeBeforeAfter();
			this.requestUpdate();
		}
	}

	override render() {
		const out = this._diffHtml || this._afterHtml || this._beforeHtml;
		return html`<div class="content">${unsafeHTML(out)}</div>`;
	}

	private async computeBeforeAfter(): Promise<void> {
		const diffs = this.diffs ?? [];
		const rootKey = AstSchemas.RootOrderSchema["x-lix-key"] as string;
		const orderDiff = diffs.find((d) => d.schema_key === rootKey);
		const beforeOrder: string[] =
			(orderDiff as any)?.snapshot_content_before?.order ?? [];
		const afterOrder: string[] =
			(orderDiff as any)?.snapshot_content_after?.order ?? [];

		const beforeMap = new Map<string, MarkdownNode>();
		const afterMap = new Map<string, MarkdownNode>();
		for (const d of diffs) {
			if (d.schema_key === rootKey) continue;
			if (d.snapshot_content_before)
				beforeMap.set(
					d.entity_id,
					d.snapshot_content_before as unknown as MarkdownNode,
				);
			if (d.snapshot_content_after)
				afterMap.set(
					d.entity_id,
					d.snapshot_content_after as unknown as MarkdownNode,
				);
		}

		const allIds = new Set<string>([
			...beforeMap.keys(),
			...afterMap.keys(),
			...beforeOrder,
			...afterOrder,
		]);
		const combined: string[] = [];
		const pushUnique = (id: string) => {
			if (id && !combined.includes(id) && allIds.has(id)) combined.push(id);
		};
		for (const id of beforeOrder) pushUnique(id);
		for (const id of afterOrder) pushUnique(id);
		for (const id of allIds) pushUnique(id);

		const beforeChildren: MarkdownNode[] = [];
		const afterChildren: MarkdownNode[] = [];
		for (const id of combined) {
			const b = beforeMap.get(id);
			if (b) beforeChildren.push(b);
			const a = afterMap.get(id);
			if (a) afterChildren.push(a);
		}

		const beforeAst: Ast = { type: "root", children: beforeChildren };
		const afterAst: Ast = { type: "root", children: afterChildren };

		const serialize = serializeToHtml as unknown as (
			ast: any,
			options?: any,
		) => Promise<string>;
		this._beforeHtml = await serialize(beforeAst as unknown as any, {
			diffHints: true,
		});
		this._afterHtml = await serialize(afterAst as unknown as any, {
			diffHints: true,
		});
		this._diffHtml = renderHtmlDiff({
			beforeHtml: this._beforeHtml,
			afterHtml: this._afterHtml,
			diffAttribute: "data-id",
		});
	}
}
