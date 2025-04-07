import { useEffect, useState } from "react";
import { useLix } from "../../hooks/use-lix";
import { useQuery } from "../../hooks/use-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "./data-table";
import { type ColumnFiltersState } from "@tanstack/react-table";

interface TableInfo {
  name: string;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export function Route() {
  const lix = useLix();

  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnDef<any>[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [tablesResult, tablesLoading, tablesError] = useQuery<
    string[][]
  >(() => {
    if (!lix) return [];
    const result = lix.sqlite.exec(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
      { returnValue: "resultRows" }
    );
    return result as any;
  }, []);

  useEffect(() => {
    if (tablesResult && tablesResult.length > 0) {
      const tableNames = tablesResult.map((row) => ({ name: row[0] })) as any;
      setTables(tableNames);
      if (tableNames.length > 0 && !selectedTable) {
        setSelectedTable(tableNames[0].name);
      }
    }
  }, [tablesResult, selectedTable]);

  const [schemaResult, schemaLoading, schemaError] = useQuery<
    any[][]
  >(async () => {
    if (!selectedTable || !lix) return [];
    const result = lix.sqlite.exec(`PRAGMA table_info(${selectedTable});`, {
      // @ts-expect-error - returnValue is not assignable to saveSql
      returnValue: "resultRows",
      rowId: "cid",
    });
    return result;
  }, [selectedTable, lix]);

  useEffect(() => {
    if (schemaResult && schemaResult.length > 0) {
      const newColumns = schemaResult.map((colData: any[]) => ({
        accessorKey: colData[1],
        header: colData[1],
        cell: ({ row }) => {
          const value = row.getValue(colData[1]);
          return String(value ?? "NULL");
        },
      }));
      setTableColumns(newColumns);
    } else {
      setTableColumns([]);
    }
  }, [schemaResult]);

  const [tableDataResult, tableDataLoading, tableDataError] = useQuery<
    any[]
  >(async () => {
    if (!selectedTable || !lix || !tableColumns.length) return [];

    try {
      let query = lix.db.selectFrom(selectedTable).limit(100).selectAll();

      columnFilters.forEach((filter) => {
        const { id, value } = filter;
        if (value) {
          query = query.where(id as any, "like", `%${value}%`);
        }
      });

      const result = await query.execute();
      return result;
    } catch (error) {
      console.error(`Error querying table ${selectedTable}:`, error);
      return [];
    }
  }, [selectedTable, lix, columnFilters, tableColumns]);

  useEffect(() => {
    setTableData(tableDataResult || []);
  }, [tableDataResult]);

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setColumnFilters([]);
    setTableData([]);
    setTableColumns([]);
  };

  if (!lix) {
    return <div>Loading Lix instance...</div>;
  }

  return (
    <div className="container mx-auto space-y-4 p-4">
      {/* Removed h1 header */}

      {/* Table Selector - Keep loading/error for initial table list fetch */}
      {tablesLoading ? (
        <p>Loading tables...</p>
      ) : tablesError ? (
        <p className="text-red-500">
          Error loading tables: {tablesError.message}
        </p>
      ) : (
        <div className="flex items-center space-x-4">
          <label htmlFor="table-select" className="font-medium">
            Select Table:
          </label>
          <Select value={selectedTable} onValueChange={handleTableSelect}>
            <SelectTrigger id="table-select" className="w-[200px]">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.name} value={table.name}>
                  {table.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedTable && (
        <div>
          {tableColumns.length > 0 ? (
            <DataTable
              table={{
                name: selectedTable,
                columns: tableColumns,
                data: tableData,
              }}
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters as any}
            />
          ) : schemaLoading ? (
            <p>Loading schema...</p>
          ) : (
            <p>
              No columns found for this table, or schema could not be loaded.
            </p>
          )}
          {schemaError && (
            <p className="text-red-500">
              Error loading schema: {schemaError.message}
            </p>
          )}
          {tableDataError && (
            <p className="text-red-500">
              Error loading table data: {tableDataError.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Route;
