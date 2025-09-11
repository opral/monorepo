import * as React from "react";

/**
 * Keyboard‑navigable accept/reject menu.
 *
 * Mock only: renders three options and calls `onPick(index)` when the user
 * presses 1/2/3 or Enter on the highlighted row. Up/Down moves the selection.
 * ESC triggers `onCancel`.
 *
 * @example
 * <AcceptChangesMenu onPick={(i) => console.log(i)} />
 */
export function AcceptChangesMenu({
  onPick,
  onCancel,
}: {
  onPick: (index: number) => void;
  onCancel?: () => void;
}) {
  const [selected, setSelected] = React.useState(0);
  const options = React.useMemo(
    () => [
      "1. Yes, accept all",
      "2. No, reject all",
      "3. Review each change individually",
    ],
    [],
  );

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Prevent conflicting scrolling while the menu is active
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        onCancel?.();
        return;
      }
      if (e.key === "ArrowUp") {
        setSelected((s) => (s + options.length - 1) % options.length);
        return;
      }
      if (e.key === "ArrowDown") {
        setSelected((s) => (s + 1) % options.length);
        return;
      }
      if (e.key === "Enter") {
        onPick(selected);
        return;
      }
      if (e.key >= "1" && e.key <= "3") {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < options.length) onPick(idx);
      }
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as any);
  }, [selected, options.length, onPick, onCancel]);

  return (
    <div className="px-1 pt-2 pb-1 select-none">
      <div className="w-full h-[2px] bg-[rgb(7,182,212)] mb-2" />
      <div className="mx-auto max-w-[720px] rounded-md bg-background">
        <div className="px-3 py-2">
          <div className="text-sm font-medium mb-2">Do you want to accept these changes?</div>
          <div className="flex flex-col">
            {options.map((label, i) => {
              const isSel = i === selected;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPick(i)}
                  className={[
                    "text-left px-3 py-2 rounded",
                    isSel ? "bg-muted" : "",
                  ].join(" ")}
                >
                  <span className="text-[13px]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
