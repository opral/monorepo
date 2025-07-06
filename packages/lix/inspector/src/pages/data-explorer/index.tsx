import { useEffect, useState } from "react";
import { useLix } from "../../hooks/use-lix";
import { useQuery } from "../../hooks/use-query";
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

export default function DataExplorer() {
  const lix = useLix();

  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedViewType, setSelectedViewType] = useState<string>("active");
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnDef<any>[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [tablesResult] = useQuery<string[][]>(() => {
    if (!lix) return [];
    try {
      // @ts-ignore - returnValue is a valid option but TypeScript doesn't recognize it
      const result = lix.sqlite.exec(
        "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY type, name;",
        { returnValue: "resultRows" }
      );
      return result as any;
    } catch (error) {
      console.error("Error querying tables and views:", error);
      return [];
    }
  }, []);

  // Process table results and extract entities
  useEffect(() => {
    if (tablesResult && tablesResult.length > 0) {
      const tableInfos = tablesResult.map((row) => ({
        name: row[0],
        type: row[1] as "table" | "view",
      }));
      setTables(tableInfos);

      // Extract entities from views
      const views = tableInfos.filter((table) => table.type === "view");
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

      const entityInfos: EntityInfo[] = Array.from(entityMap.entries()).map(
        ([name, types]) => ({
          name,
          viewTypes: Array.from(types).sort(),
        })
      );

      setEntities(entityInfos);

      // Auto-select first entity if none selected
      if (entityInfos.length > 0 && !selectedEntity) {
        setSelectedEntity(entityInfos[0]!.name);
      }

      // Auto-select first table if none selected and no entities
      if (tableInfos.length > 0 && !selectedTable && entityInfos.length === 0) {
        setSelectedTable(tableInfos[0]!.name);
      }
    }
  }, [tablesResult, selectedTable, selectedEntity]);

  // Update selectedTable when entity or view type changes
  useEffect(() => {
    if (selectedEntity && selectedViewType) {
      let tableName: string;
      if (selectedViewType === "active") {
        tableName = selectedEntity;
      } else {
        tableName = `${selectedEntity}_${selectedViewType}`;
      }
      setSelectedTable(tableName);
    }
  }, [selectedEntity, selectedViewType]);

  // Fetch table data when a table is selected
  const [tableDataResult] = useQuery<any[]>(() => {
    if (!lix || !selectedTable) return [];

    // Construct query based on selected table
    let sqlQuery = `SELECT * FROM "${selectedTable}" LIMIT 100;`;

    try {
      // @ts-ignore - returnValue is a valid option but TypeScript doesn't recognize it
      const result = lix.sqlite.exec(sqlQuery, {
        returnValue: "resultRows",
      });
      return result as any;
    } catch (error) {
      console.error(`Error querying table ${selectedTable}:`, error);
      return [];
    }
  }, [selectedTable]);

  // Get column names for the selected table
  const [columnNamesResult] = useQuery<any[]>(() => {
    if (!lix || !selectedTable) return [];
    try {
      // @ts-ignore - returnValue is a valid option but TypeScript doesn't recognize it
      const result = lix.sqlite.exec(`PRAGMA table_info("${selectedTable}");`, {
        returnValue: "resultRows",
      });
      return result as any;
    } catch (error) {
      console.error(`Error getting schema for ${selectedTable}:`, error);
      return [];
    }
  }, [selectedTable]);

  // Process column data
  useEffect(() => {
    if (selectedTable === "snapshot") {
      // --- Special case for snapshot table ---
      // Define columns manually based on the custom query structure
      const columns: ColumnDef<any>[] = [
        {
          id: "id",
          accessorKey: "0", // Corresponds to SELECT index 0
          header: "id",
          cell: (info: any) => info.getValue(),
        },
        {
          id: "content",
          accessorKey: "1", // Corresponds to SELECT index 1
          header: "content",
          cell: (info: any) => {
            // JSON renderer
            const value = info.getValue();
            try {
              // Step 1: Parse the value if it's a string containing JSON
              const parsedValue =
                typeof value === "string" ? JSON.parse(value) : value;
              // Step 2: Stringify the potentially parsed object for pretty printing
              const formattedJson = JSON.stringify(parsedValue, null, 2);
              return (
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {formattedJson}
                </pre>
              );
            } catch (e) {
              console.error(
                "Failed to parse or stringify snapshot content:",
                e,
                "Original value:",
                value
              );
              // Fallback: Display raw value or error message
              return (
                <span className="text-error text-xs">
                  Error formatting JSON
                </span>
              );
            }
          },
        },
      ];
      setTableColumns(columns);
    } else if (columnNamesResult && columnNamesResult.length > 0) {
      // --- Default case for other tables (using PRAGMA) ---
      const columns: ColumnDef<any>[] = columnNamesResult.map((col, index) => {
        const columnName = col[1]; // column name is at index 1

        // Default cell renderer (could customize for other tables later if needed)
        let cellRenderer = (info: any) => info.getValue();

        // Special formatting for snapshot_content in state views
        if (columnName === "snapshot_content") {
          cellRenderer = (info: any) => {
            const value = info.getValue();
            try {
              // Step 1: Parse the value if it's a string containing JSON
              const parsedValue =
                typeof value === "string" ? JSON.parse(value) : value;
              // Step 2: Stringify the potentially parsed object for pretty printing
              const formattedJson = JSON.stringify(parsedValue, null, 2);
              return (
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {formattedJson}
                </pre>
              );
            } catch (e) {
              console.error(
                "Failed to parse or stringify snapshot_content:",
                e,
                "Original value:",
                value
              );
              // Fallback: Display raw value or error message
              return (
                <span className="text-error text-xs">
                  Error formatting JSON
                </span>
              );
            }
          };
        }

        const columnDef: ColumnDef<any> = {
          id: columnName,
          accessorKey: String(index), // Use index from PRAGMA
          header: columnName,
          cell: cellRenderer,
        };

        // Set wider column for snapshot_content to accommodate JSON
        if (columnName === "snapshot_content") {
          columnDef.size = 800;
          columnDef.minSize = 400;
          columnDef.maxSize = 1200;
          columnDef.enableResizing = true;
        }

        return columnDef;
      });
      setTableColumns(columns);
    } else {
      setTableColumns([]);
    }
  }, [columnNamesResult, selectedTable]);

  // Process table data
  useEffect(() => {
    if (tableDataResult && tableDataResult.length > 0) {
      const data = tableDataResult.map((row) => {
        const rowData: Record<string, any> = {};
        row.forEach((cell: any, cellIndex: number) => {
          rowData[String(cellIndex)] = cell;
        });
        return rowData;
      });
      setTableData(data);
    } else {
      setTableData([]);
    }
  }, [tableDataResult]);

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
    setSelectedTable(e.target.value);
    setColumnFilters([]);
    setTableData([]);
    setTableColumns([]);
    // Reset entity selection when manually selecting a table
    setSelectedEntity("");
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const entityName = e.target.value;
    setSelectedEntity(entityName);
    setColumnFilters([]);
    setTableData([]);
    setTableColumns([]);

    // For tables selected from entity dropdown, set selectedTable directly
    if (
      tables.find((t: TableInfo) => t.name === entityName && t.type === "table")
    ) {
      setSelectedTable(entityName);
    }
  };

  const handleViewTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedViewType(e.target.value);
    setColumnFilters([]);
    setTableData([]);
    setTableColumns([]);
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
          data={tableData}
          columns={tableColumns}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
        />
      )}
    </div>
  );
}
