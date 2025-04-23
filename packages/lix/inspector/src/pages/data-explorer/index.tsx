import { useEffect, useState } from "react";
import { useLix } from "../../hooks/use-lix";
import { useQuery } from "../../hooks/use-query";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { type ColumnFiltersState } from "@tanstack/react-table";

interface TableInfo {
  name: string;
}

export default function DataExplorer() {
  const lix = useLix();

  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnDef<any>[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [tablesResult] = useQuery<string[][]>(() => {
    if (!lix) return [];
    try {
      // @ts-ignore - returnValue is a valid option but TypeScript doesn't recognize it
      const result = lix.sqlite.exec(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
        { returnValue: "resultRows" }
      );
      return result as any;
    } catch (error) {
      console.error("Error querying tables:", error);
      return [];
    }
  }, []);

  // Process table results
  useEffect(() => {
    if (tablesResult && tablesResult.length > 0) {
      const tableInfos = tablesResult.map((row) => ({
        name: row[0],
      }));
      setTables(tableInfos);

      // Auto-select first table if none selected
      if (tableInfos.length > 0 && !selectedTable) {
        setSelectedTable(tableInfos[0]!.name);
      }
    }
  }, [tablesResult, selectedTable]);

  // Fetch table data when a table is selected
  const [tableDataResult] = useQuery<any[]>(() => {
    if (!lix || !selectedTable) return [];

    // Construct query based on selected table
    let sqlQuery = `SELECT * FROM "${selectedTable}" LIMIT 100;`;
    if (selectedTable === "snapshot") {
      // Use json() function for the content column
      // Corrected columns: id, content
      sqlQuery = `SELECT id, json(content) as content FROM snapshot LIMIT 100;`;
    }

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

        // Example: Keep custom renderer logic structure if needed elsewhere
        // if (selectedTable === 'some_other_table' && columnName === 'some_column') {
        //   cellRenderer = (info: any) => { /* ... */ };
        // }

        return {
          id: columnName,
          accessorKey: String(index), // Use index from PRAGMA
          header: columnName,
          cell: cellRenderer,
        };
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

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTable(e.target.value);
    setColumnFilters([]);
    setTableData([]);
    setTableColumns([]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium whitespace-nowrap">Select table:</label>
        <select
          className="select select-bordered w-full"
          value={selectedTable}
          onChange={handleTableChange}
        >
          <option value="" disabled>
            Select a table
          </option>
          {tables.map((table) => (
            <option key={table.name} value={table.name}>
              {table.name}
            </option>
          ))}
        </select>
      </div>

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
