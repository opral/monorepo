import { useEffect, useState } from "react";
import { useLix } from "@/hooks/use-lix.ts";
import { openLixInMemory, toBlob } from "@lix-js/sdk";
import { useContext } from "react";
import { Context } from "./context";
import { DownloadIcon, FileIcon } from "lucide-react";
import DataExplorer from "./pages/data-explorer/index";
import Graph from "./pages/graph/index";
import { FloatingWindow } from "./components/floating-window";

// Define the types of content that can be displayed
type Pages = "data-explorer" | "graph";

// Configuration for each content type
const WINDOW_CONFIG: Record<
  Pages,
  {
    title: string;
    initialSize: { width: number; height: number };
  }
> = {
  "data-explorer": {
    title: "Data Explorer",
    initialSize: { width: 800, height: 600 },
  },
  graph: {
    title: "Graph",
    initialSize: { width: 900, height: 700 },
  },
};

// Window state interface
interface WindowState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isExpanded: boolean;
}

export default function App() {
  const lix = useLix();
  const { setLix, rootContainer } = useContext(Context);
  const [activeContent, setActiveContent] = useState<Pages | null>(null);
  const [pinnedWindows, setPinnedWindows] = useState<Pages[]>([]);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [windowStates, setWindowStates] = useState<Record<Pages, WindowState>>(
    {} as Record<Pages, WindowState>
  );

  // Update body padding when the inspector height changes
  useEffect(() => {
    const updateBodyPadding = () => {
      const height = `${rootContainer.offsetHeight}px`;
      const styleEl = document.getElementById(
        "lix-inspector-style"
      ) as HTMLStyleElement;
      if (styleEl) {
        styleEl.textContent = `body { padding-top: ${height}; }`;

        // Extract header height for window positioning
        const match = styleEl.textContent?.match(/padding-top:\s*(\d+)px/);
        if (match && match[1]) {
          setHeaderHeight(parseInt(match[1], 10));
        }
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

  // Initialize window states on first render
  useEffect(() => {
    if (headerHeight > 0) {
      // Calculate initial positions for windows
      // Center horizontally beneath the header
      const viewportWidth = window.innerWidth;
      const centerX = Math.max(
        0,
        (viewportWidth - WINDOW_CONFIG["data-explorer"].initialSize.width) / 2
      );
      const topY = headerHeight + 20; // Some padding below header

      // Create initial states for all window types
      const initialStates: Record<Pages, WindowState> = {} as Record<
        Pages,
        WindowState
      >;

      Object.entries(WINDOW_CONFIG).forEach(([typedPageId, config]) => {
        const pageId = typedPageId as Pages;
        initialStates[pageId] = {
          position: { x: centerX, y: topY },
          size: config.initialSize,
          isExpanded: false,
        };
      });

      setWindowStates(initialStates);
    }
  }, [headerHeight]);

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

  // Handle window state changes
  const handleWindowStateChange = (
    pageId: Pages,
    newState: Partial<WindowState>
  ) => {
    setWindowStates((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        ...newState,
      },
    }));
  };

  // Handle window pin/unpin
  const handlePinChange = (pageId: Pages, isPinned: boolean) => {
    if (isPinned) {
      setPinnedWindows((prev) => [...prev, pageId]);
    } else {
      setPinnedWindows((prev) => prev.filter((id) => id !== pageId));
    }
  };

  // Handle window close
  const handleCloseWindow = (pageId: Pages) => {
    // If window is pinned, unpin it
    if (pinnedWindows.includes(pageId)) {
      setPinnedWindows((prev) => prev.filter((id) => id !== pageId));
    }

    // If this is the active window, clear active content
    if (pageId === activeContent) {
      setActiveContent(null);
    }
  };

  // Determine which windows should be visible
  const visibleWindows = [
    // Show active content if it exists
    ...(activeContent ? [activeContent] : []),
    // Show pinned windows that aren't already shown as active content
    ...pinnedWindows.filter((id) => id !== activeContent),
  ];

  const handleNavItemClick = (id: string) => {
    if (id === "data-explorer" || id === "graph") {
      const pageId = id as Pages;

      // If the window is already pinned, just make it active
      if (pinnedWindows.includes(pageId)) {
        setActiveContent(pageId);
        return;
      }

      // Otherwise, set it as the active content
      setActiveContent(pageId);
    }
  };

  return (
    <div className="flex flex-col w-full" data-theme="light">
      <header className="bg-background border-b border-base-200">
        <div className="container mx-auto py-1 px-2 flex items-center">
          <span className="text-sm font-medium mr-4">Lix Inspector</span>

          <div className="join">
            {[
              { id: "graph", label: "Graph" },
              { id: "data-explorer", label: "Data Explorer" },
            ].map((item) => (
              <button
                key={item.id}
                className={`join-item btn btn-xs ${
                  activeContent === item.id ? "btn-active" : "btn-ghost"
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

      {/* Render all visible windows */}
      {visibleWindows.map((pageId) => (
        <FloatingWindow
          key={pageId}
          title={WINDOW_CONFIG[pageId].title}
          isOpen={true}
          onClose={() => handleCloseWindow(pageId)}
          initialPosition={windowStates[pageId].position}
          initialSize={windowStates[pageId].size}
          isExpanded={windowStates[pageId].isExpanded}
          isPinned={pinnedWindows.includes(pageId)}
          onPinChange={(isPinned) => handlePinChange(pageId, isPinned)}
          onPositionChange={(position) =>
            handleWindowStateChange(pageId, { position })
          }
          onSizeChange={(size) => handleWindowStateChange(pageId, { size })}
          onExpandedChange={(isExpanded) =>
            handleWindowStateChange(pageId, { isExpanded })
          }
        >
          {pageId === "data-explorer" ? <DataExplorer /> : <Graph />}
        </FloatingWindow>
      ))}
    </div>
  );
}
