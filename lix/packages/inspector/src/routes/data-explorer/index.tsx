import { DataTable } from "./data-table.tsx";
import { useLix } from "@/hooks/use-lix.ts";
import { useQuery } from "@/hooks/use-query.ts";
import { useState, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableInfo {
  name: string;
}

export default function Route() {
  const lix = useLix();

  const [selectedTable, setSelectedTable] = useState("account");

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);

  // Query available tables using raw SQL
  const [queryResult, tablesLoading, tablesError] = useQuery<
    { name: string }[]
  >(() => {
    const result = lix.sqlite.exec(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      { returnValue: "resultRows" }
    );
    return result.flatMap((row) => ({ name: row[0] })) as any;
  }, []);

  const [tableQueryResult, tableDataLoading, tableDataError] =
    useQuery(async () => {
      if (!selectedTable) return Promise.resolve(null);

      try {
        const result = await lix.db
          .selectFrom(selectedTable)
          .limit(100)
          .selectAll()
          .execute();

        return result;
      } catch (error) {
        console.error(`Error querying table ${selectedTable}:`, error);
        throw error;
      }
    }, [selectedTable]);

  // Extract tables from query result
  useEffect(() => {
    if (queryResult && queryResult.length > 0) {
      setTables(queryResult as TableInfo[]);
    }
  }, [queryResult]);

  // Extract data and generate columns from table query result
  useEffect(() => {
    if (tableQueryResult && tableQueryResult.length > 0) {
      setTableData(tableQueryResult);
      deriveColumns(tableQueryResult);
    } else {
      setTableData([]);
      setColumns([]);
    }
  }, [tableQueryResult]);

  // Generate columns based on data
  const deriveColumns = (data: any[]) => {
    if (data.length === 0) return;

    const firstRow = data[0];
    const newColumns: ColumnDef<any>[] = Object.keys(firstRow).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => {
        const value = info.getValue();
        // Handle different data types for display
        if (value === null) return "NULL";
        if (typeof value === "object") {
          try {
            return JSON.stringify(value);
          } catch (e) {
            return "[Object]";
          }
        }
        return String(value);
      },
    }));
    setColumns(newColumns);
  };

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName || null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Select Table
            </label>
            <Select
              disabled={tablesLoading}
              onValueChange={handleTableSelect}
              value={selectedTable || undefined}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a table..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tablesError && (
              <p className="text-red-500 mt-1">
                Error loading tables: {tablesError.message}
              </p>
            )}
          </div>

          {selectedTable && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Table: {selectedTable}
              </h2>
              {tableDataLoading ? (
                <p>Loading table data...</p>
              ) : tableDataError ? (
                <p className="text-red-500">
                  Error loading table data: {tableDataError.message}
                </p>
              ) : tableData.length === 0 ? (
                <p>No data found in this table.</p>
              ) : (
                <DataTable columns={columns} data={tableData} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
