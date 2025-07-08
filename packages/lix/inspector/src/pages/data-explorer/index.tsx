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

function DataExplorerContent() {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedViewType, setSelectedViewType] = useState<string>("active");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
        const cellRenderer = defaultCellRenderer;

        const columnDef: ColumnDef<any> = {
          id: columnName,
          accessorKey: columnName,
          header: columnName,
          cell: cellRenderer,
        };

        // Check if the column contains objects by sampling the first row
        const firstRowValue = tableDataQueryResult?.[0]?.[columnName];
        if (typeof firstRowValue === 'object' && firstRowValue !== null) {
          columnDef.size = 800;
          columnDef.minSize = 400;
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
        <DataTable
          data={computedTableData}
          columns={computedTableColumns}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
        />
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
