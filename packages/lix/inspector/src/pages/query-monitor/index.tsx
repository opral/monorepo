import { useState, useMemo } from "react";
import { useQuery } from "@lix-js/react-utils";
import {
  Search,
  AlertTriangle,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import QueryDetails from "./query-details";
import PerformanceMetrics from "./performance-metrics";

type QueryType =
  | "SELECT"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "CREATE"
  | "DROP"
  | "ALTER"
  | "TRANSACTION"
  | "OTHER";

interface QueryLogEntry {
  id: string;
  message: string;
  payload?: {
    sql: string;
    bindings: any[];
    duration_ms: number;
    result_count: number;
    query_type: QueryType;
    subscription_id?: string;
    timestamp: string;
  };
  lixcol_created_at: string;
}

export default function QueryMonitor() {
  const [selectedType, setSelectedType] = useState<QueryType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [showSlowQueriesOnly, setShowSlowQueriesOnly] = useState(false);

  // Fetch query logs
  const queryLogs = useQuery(
    (lix) =>
      lix.db
        .selectFrom("log")
        .select(["id", "message", "payload", "lixcol_created_at"])
        .where("key", "=", "lix_query_executed")
        .orderBy("lixcol_created_at", "desc"),
    { subscribe: autoRefresh },
  ) as QueryLogEntry[];

  // Filter and search queries
  const filteredQueries = useMemo(() => {
    return queryLogs.filter((log) => {
      if (!log.payload) return false;

      debugger;
      // Type filter
      if (selectedType !== "ALL" && log.payload.query_type !== selectedType) {
        return false;
      }

      // Slow query filter
      if (showSlowQueriesOnly && log.payload.duration_ms <= 100) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          log.payload.sql.toLowerCase().includes(searchLower) ||
          log.message.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [queryLogs, selectedType, searchQuery, showSlowQueriesOnly]);

  // Calculate paginated queries
  const paginatedQueries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredQueries.slice(startIndex, endIndex);
  }, [filteredQueries, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedType, searchQuery, showSlowQueriesOnly]);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    const validQueries = filteredQueries.filter((q) => q.payload);
    if (validQueries.length === 0) {
      return { avgDuration: 0, slowQueries: 0, totalQueries: 0 };
    }

    const durations = validQueries.map((q) => q.payload!.duration_ms);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const slowQueries = durations.filter((d) => d > 100).length;

    return {
      avgDuration: Math.round(avgDuration),
      slowQueries,
      totalQueries: validQueries.length,
    };
  }, [filteredQueries]);

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const queryTypes: (QueryType | "ALL")[] = [
    "ALL",
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "DROP",
    "ALTER",
    "TRANSACTION",
    "OTHER",
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Query Monitor
          </h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Auto refresh</span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="join">
            {queryTypes.map((type) => (
              <button
                key={type}
                className={`join-item btn btn-xs ${
                  selectedType === type ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-9"
              />
            </div>
          </div>

          {searchQuery && (
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </button>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSlowQueriesOnly}
              onChange={(e) => setShowSlowQueriesOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-warning" />
              Slow queries only
            </span>
          </label>
        </div>

        {/* Performance Metrics */}
        <PerformanceMetrics metrics={metrics} />
      </div>

      {/* Query Table */}
      <div className="flex-1 overflow-auto">
        <table className="table table-xs">
          <thead className="sticky top-0 bg-base-100 z-10">
            <tr>
              <th className="w-32">Time</th>
              <th className="w-20">Type</th>
              <th className="w-24">Duration</th>
              <th className="w-20">Results</th>
              <th>Query Preview</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedQueries.map((log) => {
              const isExpanded = expandedRows.has(log.id);
              const isSlowQuery = log.payload && log.payload.duration_ms > 100;

              return (
                <>
                  <tr
                    key={log.id}
                    className={`hover cursor-pointer ${
                      isSlowQuery ? "bg-warning/10" : ""
                    }`}
                    onClick={() => toggleRowExpansion(log.id)}
                  >
                    <td className="font-mono text-xs">
                      {new Date(log.lixcol_created_at).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className="badge badge-xs">
                        {log.payload?.query_type || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="text-right">
                      {isSlowQuery && (
                        <AlertTriangle className="inline h-3 w-3 text-warning mr-1" />
                      )}
                      {log.payload?.duration_ms || 0}ms
                    </td>
                    <td className="text-right">
                      {log.payload?.result_count || 0}
                    </td>
                    <td className="truncate max-w-md">
                      {log.payload?.sql || log.message}
                    </td>
                    <td>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </td>
                  </tr>
                  {isExpanded && log.payload && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <QueryDetails log={log} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filteredQueries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No queries found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredQueries.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t bg-base-100">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredQueries.length)} of{" "}
            {filteredQueries.length} queries
          </div>
          
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              className="btn btn-sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
