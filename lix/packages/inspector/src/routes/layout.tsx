import React, { useEffect, useState } from "react";
import { useLix } from "@/hooks/use-lix.ts";
import { openLixInMemory, toBlob } from "@lix-js/sdk";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ChevronDown, ChevronUp, DownloadIcon, FileIcon } from "lucide-react";
import { useContext } from "react";
import { Context } from "../context";

export default function Layout() {
  const lix = useLix();
  const { setLix, rootContainer } = useContext(Context);
  const [exportStatus, setExportStatus] = React.useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update body padding when the inspector height changes
  useEffect(() => {
    if (!rootContainer) return;
    
    const updateBodyPadding = () => {
      const height = isCollapsed ? '40px' : `${rootContainer.offsetHeight}px`;
      const styleEl = document.getElementById('lix-inspector-style') as HTMLStyleElement;
      if (styleEl) {
        styleEl.textContent = `body { padding-top: ${height}; }`;
      }
    };

    // Initial update
    updateBodyPadding();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateBodyPadding);
    resizeObserver.observe(rootContainer);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [rootContainer, isCollapsed]);

  // Export Lix as blob
  const exportLixAsBlob = async () => {
    try {
      setExportStatus("Exporting...");
      const blob = await toBlob({ lix });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lix-export-${new Date().toISOString().slice(0, 10)}.lix`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportStatus("Export successful");

        // Clear status after 3 seconds
        setTimeout(() => setExportStatus(null), 3000);
      }, 100);
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const openLixBlob = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".lix";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const buffer = await file.arrayBuffer();
      const newLix = await openLixInMemory({ blob: new Blob([buffer]) });
      setLix(newLix);
    };

    input.click();
  };

  // Navigation items
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/data-explorer", label: "Data Explorer" },
    { path: "/graph", label: "Graph" },
  ];

  return (
    <div className="flex flex-col w-full">
      <header className="border-b bg-background">
        <div className="container mx-auto py-2 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mr-2"
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </Button>
            <span className="font-medium">Lix Inspector</span>
          </div>

          {!isCollapsed && (
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md ${
                    location.pathname === item.path
                      ? "bg-gray-200 font-medium"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center space-x-2">
            {exportStatus && !isCollapsed && (
              <span
                className={`text-sm ${exportStatus.includes("failed") ? "text-red-600" : "text-green-600"}`}
              >
                {exportStatus}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openLixBlob}>
                  <FileIcon className="mr-2 h-4 w-4" />
                  Open lix
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportLixAsBlob}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export lix
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {!isCollapsed && (
        <main className="flex-1 container mx-auto px-4 py-4">
          <Outlet />
        </main>
      )}
    </div>
  );
}
