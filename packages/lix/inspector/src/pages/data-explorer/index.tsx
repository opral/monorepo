import { useState, Suspense, useMemo } from "react";
import { useQuery } from "@lix-js/react-utils";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { type ColumnFiltersState } from "@tanstack/react-table";

interface TableInfo {
  name: string;
  type: "table" | "view";
}

interface EntityInfo {
  name: string;
  viewTypes: string[];
}

// Stable cell renderers to prevent re-creation
const defaultCellRenderer = (info: any) => {
  const value = info.getValue();
  if (typeof value === 'object' && value !== null) {
    return jsonCellRenderer(info);
  }
  return value;
};

const jsonCellRenderer = (info: any) => {
  const value = info.getValue();
  try {
    const parsedValue = typeof value === "string" ? JSON.parse(value) : value;
    const formattedJson = JSON.stringify(parsedValue, null, 2);
    return (
      <pre className="text-xs whitespace-pre-wrap break-all">
        {formattedJson}
      </pre>
    );
  } catch (e) {
    console.error("Failed to parse or stringify JSON content:", e);
    return <span className="text-error text-xs">Error formatting JSON</span>;
  }
};

// Utilities to detect and format binary/text
function toUint8Array(value: any): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return new Uint8Array(value as number[]);
  if (typeof value === 'object') {
    // Detect objects with numeric keys: {"0":45, "1":120, ...}
    const keys = Object.keys(value);
    if (keys.length === 0) return null;
    const numeric = keys.every((k) => /^\d+$/.test(k));
    if (!numeric) return null;
    const max = keys.reduce((m, k) => Math.max(m, Number(k)), 0);
    const arr = new Uint8Array(max + 1);
    for (const k of keys) {
      const n = Number(k);
      const v = (value as any)[k];
      arr[n] = typeof v === 'number' ? v : 0;
    }
    return arr;
  }
  if (typeof value === 'string') {
    // Try base64
    try {
      const bin = atob(value);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr;
    } catch {}
  }
  return null;
}

function asciiRatio(bytes: Uint8Array, sample = 1024): number {
  const len = Math.min(bytes.length, sample);
  if (len === 0) return 0;
  let printable = 0;
  for (let i = 0; i < len; i++) {
    const c = bytes[i]!;
    if (
      (c >= 32 && c <= 126) || // printable
      c === 9 || c === 10 || c === 13 // tab, lf, cr
    )
      printable++;
  }
  return printable / len;
}

function bytesToAscii(bytes: Uint8Array, max = 200): string {
  let out = '';
  const n = Math.min(bytes.length, max);
  for (let i = 0; i < n; i++) {
    const c = bytes[i]!;
    if (c === 9) out += '\t';
    else if (c === 10) out += '\n';
    else if (c === 13) out += '\r';
    else if (c >= 32 && c <= 126) out += String.fromCharCode(c);
    else out += '·';
  }
  if (bytes.length > max) out += '…';
  return out;
}

function bytesToHexPreview(bytes: Uint8Array, maxBytes = 16): string {
  const n = Math.min(bytes.length, maxBytes);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(bytes[i]!.toString(16).padStart(2, '0'));
  }
  const hex = parts.join(' ').toUpperCase();
  return bytes.length > n ? `${hex} …` : hex;
}

function Hexdump({ bytes }: { bytes: Uint8Array }) {
  const rows: string[] = [];
  const width = 16;
  for (let off = 0; off < bytes.length; off += width) {
    const slice = bytes.slice(off, off + width);
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
    const ascii = Array.from(slice)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    rows.push(
      `${off.toString(16).padStart(4, '0')}: ${hex.padEnd(47, ' ')}  |${ascii}|`
    );
  }
  return (
    <pre className="text-xs whitespace-pre leading-4 overflow-auto max-h-[60vh]">
      {rows.join('\n')}
    </pre>
  );
}

function DataExplorerContent() {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedViewType, setSelectedViewType] = useState<string>("active");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [viewer, setViewer] = useState<
    | null
    | {
        id: string | number | undefined;
        path?: string;
        column: string;
        bytes: Uint8Array;
        mode: 'auto' | 'text' | 'hex' | 'base64';
      }
  >(null);

  const tablesQueryData = useQuery((lix) =>
    lix.db
      .selectFrom("sqlite_master" as any)
      .select(["name", "type"])
      .where("type", "in", ["table", "view"])
      .orderBy("type")
      .orderBy("name")
  );

  // Compute tables and entities directly from query result using useMemo
  const tables = useMemo(
    () =>
      tablesQueryData.map((row) => ({
        name: row.name,
        type: row.type as "table" | "view",
      })),
    [tablesQueryData]
  );

  const entities = useMemo(() => {
    const views = tables.filter((table) => table.type === "view");
    const entityMap = new Map<string, Set<string>>();

    views.forEach((view) => {
      const name = view.name;
      let entityName: string;
      let viewType: string;

      if (name?.endsWith("_all")) {
        entityName = name.slice(0, -4);
        viewType = "all";
      } else if (name?.endsWith("_history")) {
        entityName = name.slice(0, -8);
        viewType = "history";
      } else {
        entityName = name ?? "unknown name";
        viewType = "active";
      }

      if (!entityMap.has(entityName)) {
        entityMap.set(entityName, new Set());
      }
      entityMap.get(entityName)!.add(viewType);
    });

    return Array.from(entityMap.entries()).map(([name, types]) => ({
      name,
      viewTypes: Array.from(types).sort(),
    }));
  }, [tables]);

  // Compute selectedTable directly from selectedEntity and selectedViewType
  const selectedTable = useMemo(() => {
    if (!selectedEntity) return "";

    if (selectedViewType === "active") {
      return selectedEntity;
    } else {
      return `${selectedEntity}_${selectedViewType}`;
    }
  }, [selectedEntity, selectedViewType]);

  // Fetch table data when a table is selected
  const tableDataQueryResult = useQuery((lix) => {
    if (!selectedTable) {
      return lix.db
        .selectFrom("sqlite_master" as any)
        .select("name")
        .where("name", "=", "")
        .limit(0);
    }
    return lix.db
      .selectFrom(selectedTable as any)
      .selectAll()
      .limit(100);
  });

  // Get column names from the first row of data or infer from keys
  const columnNames = useMemo(() => {
    if (
      !selectedTable ||
      !tableDataQueryResult ||
      tableDataQueryResult.length === 0
    ) {
      return [];
    }
    // Get column names from the first row's keys
    return Object.keys(tableDataQueryResult[0]!);
  }, [selectedTable, tableDataQueryResult]);

  // Create a stable string representation of column names for memoization
  const columnNamesKey = useMemo(() => {
    return columnNames.join(",");
  }, [columnNames]);

  // Compute columns from query result
  const computedTableColumns = useMemo(() => {
    if (!selectedTable || columnNames.length === 0) {
      return [];
    }

    if (selectedTable === "snapshot") {
      // --- Special case for snapshot table ---
      return [
        {
          id: "id",
          accessorKey: "id",
          header: "id",
          cell: defaultCellRenderer,
        },
        {
          id: "content",
          accessorKey: "content",
          header: "content",
          cell: jsonCellRenderer,
        },
      ];
    } else {
      return columnNames.map((columnName: string) => {
        const firstRowValue = tableDataQueryResult?.[0]?.[columnName];
        const maybeBytes = toUint8Array(firstRowValue);

        const cellRenderer = maybeBytes
          ? (info: any) => {
              const raw = info.getValue();
              const bytes = toUint8Array(raw);
              if (!bytes) {
                return <span className="text-xs opacity-70">(no data)</span>;
              }
              const ratio = asciiRatio(bytes);
              const isText = ratio >= 0.85;
              const label = isText
                ? `"${bytesToAscii(bytes, 80)}"`
                : `hex: ${bytesToHexPreview(bytes, 16)}`;
              return (
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs max-w-[420px] inline-block">
                    {label}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs"
                    title="Open viewer"
                    onClick={() =>
                      setViewer({
                        id: info.row?.original?.id as any,
                        path: (info.row?.original?.path as string) ?? undefined,
                        column: columnName,
                        bytes,
                        mode: 'auto',
                      })
                    }
                  >
                    ⤢
                  </button>
                </div>
              );
            }
          : defaultCellRenderer;

        const columnDef: ColumnDef<any> = {
          id: columnName,
          accessorKey: columnName,
          header: columnName,
          cell: cellRenderer,
        };

        if (maybeBytes || (typeof firstRowValue === 'object' && firstRowValue !== null)) {
          columnDef.size = 800;
          columnDef.minSize = 300;
          columnDef.maxSize = 1200;
          columnDef.enableResizing = true;
        }

        return columnDef;
      });
    }
  }, [selectedTable, columnNamesKey, tableDataQueryResult]);

  // Use the query result directly as table data (no transformation needed)
  const computedTableData = useMemo(() => {
    return tableDataQueryResult || [];
  }, [tableDataQueryResult]);

  // Log table auto-filter integration
  // useEffect(() => {
  //   // Only auto-apply if log table exists and the log table is not already selected
  //   const logFilter = window.localStorage.getItem("lix-inspector-log-filter");
  //   if (tables.some((t) => t.name === "log") && selectedTable !== "log") {
  //     setSelectedTable("log");
  //     if (logFilter) {
  //       setColumnFilters([{ id: "level", value: logFilter }]);
  //       window.localStorage.removeItem("lix-inspector-log-filter");
  //     } else {
  //       setColumnFilters([]); // Show all logs if no filter
  //     }
  //   }
  // }, [tables, selectedTable]);

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tableName = e.target.value;
    setColumnFilters([]);

    // When directly selecting a table, reset entity selection
    // and set the entity to the table name for consistency
    setSelectedEntity(tableName);
    setSelectedViewType("active"); // Direct table selection implies active view
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const entityName = e.target.value;
    setSelectedEntity(entityName);
    setColumnFilters([]);

    // For real tables, ensure view type is set to active
    if (
      tables.find((t: TableInfo) => t.name === entityName && t.type === "table")
    ) {
      setSelectedViewType("active");
    }
  };

  const handleViewTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedViewType(e.target.value);
    setColumnFilters([]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium whitespace-nowrap">Entity:</label>
        <select
          className="select select-bordered w-full"
          value={selectedEntity}
          onChange={handleEntityChange}
        >
          <option value="" disabled>
            Select an entity
          </option>
          {/* Group entities first */}
          {entities.length > 0 && (
            <optgroup label="Entities">
              {entities.map((entity: EntityInfo) => (
                <option key={entity.name} value={entity.name}>
                  {entity.name}
                </option>
              ))}
            </optgroup>
          )}
          {/* Then group tables */}
          {tables.filter((table: TableInfo) => table.type === "table").length >
            0 && (
            <optgroup label="Tables">
              {tables
                .filter((table: TableInfo) => table.type === "table")
                .map((table: TableInfo) => (
                  <option key={table.name} value={table.name}>
                    {table.name}
                  </option>
                ))}
            </optgroup>
          )}
        </select>

        {selectedEntity &&
          entities.find((e: EntityInfo) => e.name === selectedEntity)?.viewTypes
            .length > 1 && (
            <>
              <label className="font-medium whitespace-nowrap">View:</label>
              <select
                className="select select-bordered w-full"
                value={selectedViewType}
                onChange={handleViewTypeChange}
              >
                {entities
                  .find((e: EntityInfo) => e.name === selectedEntity)
                  ?.viewTypes.map((viewType: string) => (
                    <option key={viewType} value={viewType}>
                      {viewType === "active"
                        ? "active (state)"
                        : viewType === "all"
                          ? "all (state across versions)"
                          : viewType === "history"
                            ? "history"
                            : viewType}
                    </option>
                  ))}
              </select>
            </>
          )}
      </div>

      {/* Fallback table selector for direct table selection */}
      {!selectedEntity && (
        <div className="mb-4 flex items-center gap-2">
          <label className="font-medium whitespace-nowrap">
            Or select table/view directly:
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedTable}
            onChange={handleTableChange}
          >
            <option value="" disabled>
              Select a table or view
            </option>
            {/* Group views first */}
            {tables.filter((table: TableInfo) => table.type === "view").length >
              0 && (
              <optgroup label="Views">
                {tables
                  .filter((table: TableInfo) => table.type === "view")
                  .map((table: TableInfo) => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
              </optgroup>
            )}
            {/* Then group tables */}
            {tables.filter((table: TableInfo) => table.type === "table")
              .length > 0 && (
              <optgroup label="Tables">
                {tables
                  .filter((table: TableInfo) => table.type === "table")
                  .map((table: TableInfo) => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      {selectedTable && (
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <DataTable
              data={computedTableData}
              columns={computedTableColumns}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              tableId={`data-explorer:${selectedTable}`}
            />
          </div>
          {viewer && (
            <div className="w-[520px] shrink-0 border-l pl-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">
                  Data • {viewer.column}
                  {viewer.path ? ` • ${viewer.path}` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="select select-bordered select-xs"
                    value={viewer.mode}
                    onChange={(e) =>
                      setViewer({ ...viewer, mode: e.target.value as any })
                    }
                  >
                    <option value="auto">Auto</option>
                    <option value="text">Text</option>
                    <option value="hex">Hexdump</option>
                    <option value="base64">Base64</option>
                  </select>
                  <button className="btn btn-xs" onClick={() => setViewer(null)}>
                    Close
                  </button>
                </div>
              </div>

              {(() => {
                if (!viewer) return null;
                const bytes = viewer.bytes;
                const autoText = asciiRatio(bytes) >= 0.85;
                const mode = viewer.mode === 'auto' ? (autoText ? 'text' : 'hex') : viewer.mode;
                if (mode === 'text') {
                  return (
                    <pre className="text-xs whitespace-pre-wrap break-all max-h-[60vh] overflow-auto">
                      {bytesToAscii(bytes, 10000)}
                    </pre>
                  );
                }
                if (mode === 'base64') {
                  let bin = '';
                  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
                  const b64 = btoa(bin);
                  return (
                    <textarea readOnly className="textarea textarea-bordered w-full h-[60vh] text-xs">
                      {b64}
                    </textarea>
                  );
                }
                return <Hexdump bytes={bytes} />;
              })()}

              <div className="mt-2 flex items-center gap-2">
                <button
                  className="btn btn-xs"
                  onClick={() => {
                    const bytes = viewer.bytes;
                    const autoText = asciiRatio(bytes) >= 0.85;
                    const mode = viewer.mode === 'auto' ? (autoText ? 'text' : 'hex') : viewer.mode;
                    let content = '';
                    if (mode === 'text') {
                      content = bytesToAscii(bytes, 100000);
                    } else if (mode === 'base64') {
                      let bin = '';
                      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
                      content = btoa(bin);
                    } else {
                      const hexParts: string[] = [];
                      for (let i = 0; i < bytes.length; i++) {
                        const b = bytes[i]!;
                        hexParts.push(b.toString(16).padStart(2, '0').toUpperCase());
                      }
                      content = hexParts.join(' ');
                    }
                    navigator.clipboard.writeText(content).catch(() => {});
                  }}
                >
                  Copy
                </button>
                <button
                  className="btn btn-xs"
                  onClick={() => {
                    const blob = new Blob([viewer.bytes]);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'data.bin';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 100);
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataExplorer() {
  return (
    <Suspense
      fallback={<div className="container mx-auto p-4">Loading...</div>}
    >
      <DataExplorerContent />
    </Suspense>
  );
}
