// @vitest-environment jsdom
import { test, expect } from "vitest";
import { DiffComponent } from "./diff.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import type { AstSchemas } from "@opral/markdown-wc";

const TAG = "x-diff-test";
if (!customElements.get(TAG)) customElements.define(TAG, DiffComponent);

// Basic rendering
test("renders stacked Before/After HTML for a simple paragraph change", async () => {
  const el = new DiffComponent();
  document.body.appendChild(el);

    const beforeNode: AstSchemas.ParagraphNode = {
      type: "paragraph",
      data: { id: 'p1' },
      children: [{ type: "text", value: "Hello world." } ],
    };

    const afterNode: AstSchemas.ParagraphNode = {
      type: "paragraph",
      data: { id: 'p1' },
      children: [{ type: "text", value: "Hello brave new world." } ],
    };

	const diffs: UiDiffComponentProps["diffs"] = [
		{
			plugin_key: "plugin_md",
			schema_key: "markdown_wc_paragraph",
			entity_id: "p1",
			snapshot_content_before: beforeNode,
			snapshot_content_after: afterNode,
		},
	];
  el.diffs = diffs;

	// Wait for async serialization and Lit updates to flush
	for (let i = 0; i < 10; i++) {
    await el.updateComplete;
		if ((el as any)._afterHtml || (el as any)._beforeHtml) break;
		await new Promise((r) => setTimeout(r, 10));
	}

	const shadow = (el as any).shadowRoot as ShadowRoot;
	const content = shadow.querySelector(".content") as HTMLElement;
	expect(content).toBeTruthy();
	const html = content.innerHTML;
  // Should include inline diff markup for the inserted words
  expect(html).toContain('<span class="diff-created">brave');
  // Still contains the rest of the sentence
  expect(html).toContain('world');
});

test.todo("renders plain text when entity.type === 'text' with value");
test.todo("serializes md-wc nodes with children via serializeToHtml");
test.todo("aggregates multiple entities in stable order");

// Reactive updates
test.todo("updates output when the 'diffs' property changes");
test.todo("handles addition-only (only after) and deletion-only (only before)");
test.todo("renders empty panels when 'diffs' is [] or undefined");

// Robustness
test.todo(
	"ignores malformed entities without throwing and continues rendering",
);
test.todo("does not crash on unknown node types; falls back to <div>");

// Integration with html-diff (future)
test.todo(
	"embeds @lix-js/html-diff to render inline additions/deletions (future)",
);
test.todo("applies html-diff default.css styles (future)");
