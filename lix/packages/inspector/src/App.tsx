import { useEffect, useState } from "react";
import { useLix } from "@/hooks/use-lix.ts";
import { openLixInMemory, toBlob } from "@lix-js/sdk";
import { useContext } from "react";
import { Context } from "./context";
import { DownloadIcon, FileIcon } from "lucide-react";
import { FloatingWindow } from "./components/floating-window";
import DataExplorer from "./routes/data-explorer/index";
import { FloatingGraph } from "./components/floating-graph";

export default function App() {
  const lix = useLix();
  const { setLix, rootContainer } = useContext(Context);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  // Update body padding when the inspector height changes
  useEffect(() => {
    const updateBodyPadding = () => {
      const height = `${rootContainer.offsetHeight}px`;
      const styleEl = document.getElementById(
        "lix-inspector-style"
      ) as HTMLStyleElement;
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
  }, [rootContainer]);

  // Export Lix as blob
  const exportLixAsBlob = async () => {
    try {
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
      }, 100);
    } catch (error) {
      console.error("Export error:", error);
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

  // Handle navigation item clicks
  const handleNavItemClick = (id: string) => {
    if (id === "data-explorer") {
      setIsDataExplorerOpen(true);
      return;
    }

    if (id === "graph") {
      setIsGraphOpen(true);
      return;
    }
  };

  // Navigation items
  const navItems = [
    { id: "graph", label: "Graph" },
    { id: "data-explorer", label: "Data Explorer" },
  ];

  return (
    <div className="flex flex-col w-full" data-theme="light">
      <header className="bg-background border-b border-base-200">
        <div className="container mx-auto py-1 px-2 flex items-center">
          <span className="text-sm font-medium mr-4">Lix</span>

          <div className="join">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`join-item btn btn-xs ${
                  (item.id === "graph" && isGraphOpen) ||
                  (item.id === "data-explorer" && isDataExplorerOpen)
                    ? "btn-active"
                    : "btn-ghost"
                }`}
                onClick={() => handleNavItemClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-xs">
                Actions
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
              >
                <li>
                  <a onClick={openLixBlob}>
                    <FileIcon className="mr-2 h-4 w-4" />
                    Open lix
                  </a>
                </li>
                <li>
                  <a onClick={exportLixAsBlob}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export lix
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Data Explorer Window */}
      <FloatingWindow
        title="Data Explorer"
        isOpen={isDataExplorerOpen}
        onClose={() => setIsDataExplorerOpen(false)}
        initialPosition={{ x: 100, y: 100 }}
      >
        <DataExplorer />
      </FloatingWindow>

      {/* Floating Graph Window */}
      <FloatingGraph
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
      />
    </div>
  );
}
