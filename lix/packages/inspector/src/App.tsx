import { useEffect, useState, ReactNode } from "react";
import { useLix } from "@/hooks/use-lix.ts";
import { openLixInMemory, toBlob } from "@lix-js/sdk";
import { useContext } from "react";
import { Context } from "./context";
import { DownloadIcon, FileIcon } from "lucide-react";
import DataExplorer from "./pages/data-explorer/index";
import Graph from "./pages/graph/index";
import { FloatingWindow } from "./components/floating-window";

// Floating content types and component
export type Pages = "data-explorer" | "graph";

const WINDOW_CONFIG = {
  "data-explorer": {
    title: "Data Explorer",
    initialSize: { width: 800, height: 600 },
  },
  graph: {
    title: "Graph",
    initialSize: { width: 900, height: 700 },
  },
};

// Window position and size state interface
interface WindowState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isFullSize: boolean;
}

export default function App() {
  const lix = useLix();
  const { setLix, rootContainer } = useContext(Context);
  const [activeContent, setActiveContent] = useState<Pages | null>(null);
  const [pinnedWindows, setPinnedWindows] = useState<Pages[]>([]);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [windowStates, setWindowStates] = useState<Record<Pages, WindowState>>(
    {}
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

  // Initialize window states with centered positions
  useEffect(() => {
    if (headerHeight > 0) {
      const viewportWidth = window.innerWidth;

      // Initialize window states with centered positions
      const initialStates: Record<Pages, WindowState> = {} as Record<
        Pages,
        WindowState
      >;

      Object.entries(WINDOW_CONFIG).forEach(([pageId, config]) => {
        const typedPageId = pageId as Pages;
        const centerX = Math.max(
          0,
          (viewportWidth - config.initialSize.width) / 2
        );
        const topY = headerHeight + 20; // Position just below the header with some padding

        initialStates[typedPageId] = {
          position: { x: centerX, y: topY },
          size: config.initialSize,
          isFullSize: false,
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

  const handlePinChange = (pageId: Pages, isPinned: boolean) => {
    if (isPinned) {
      // Add to pinned windows if not already there
      if (!pinnedWindows.includes(pageId)) {
        setPinnedWindows([...pinnedWindows, pageId]);
      }
    } else {
      // Remove from pinned windows
      setPinnedWindows(pinnedWindows.filter((id) => id !== pageId));
    }
  };

  const handleCloseWindow = (pageId: Pages) => {
    // Remove from pinned windows if it's pinned
    if (pinnedWindows.includes(pageId)) {
      setPinnedWindows(pinnedWindows.filter((id) => id !== pageId));
    }

    // If this is the active window, clear active content
    if (activeContent === pageId) {
      setActiveContent(null);
    }
  };

  // Handle window state changes (position, size, fullscreen)
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

  const navItems = [
    { id: "graph", label: "Graph" },
    { id: "data-explorer", label: "Data Explorer" },
  ];

  // Determine which windows should be displayed
  const visibleWindows = Array.from(
    new Set([...(activeContent ? [activeContent] : []), ...pinnedWindows])
  ) as Pages[];

  return (
    <div className="flex flex-col w-full" data-theme="light">
      <header className="bg-background border-b border-base-200">
        <div className="container mx-auto py-1 px-2 flex items-center">
          <span className="text-sm font-medium mr-4">Lix Inspector</span>

          <div className="join">
            {navItems.map((item) => (
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
        <FloatingPage
          key={pageId}
          pageId={pageId}
          isActive={pageId === activeContent}
          onClose={() => handleCloseWindow(pageId)}
          onPinChange={(isPinned) => handlePinChange(pageId, isPinned)}
          isPinned={pinnedWindows.includes(pageId)}
          windowState={windowStates[pageId]}
          onWindowStateChange={(newState) =>
            handleWindowStateChange(pageId, newState)
          }
          children={{
            "data-explorer": <DataExplorer />,
            graph: <Graph />,
          }}
        />
      ))}
    </div>
  );
}

function FloatingPage(props: {
  pageId: Pages;
  isActive: boolean;
  isPinned: boolean;
  onClose: () => void;
  onPinChange: (isPinned: boolean) => void;
  windowState?: WindowState;
  onWindowStateChange: (newState: Partial<WindowState>) => void;
  children: {
    [key in Pages]: ReactNode;
  };
}) {
  const {
    pageId,
    isPinned,
    onClose,
    onPinChange,
    children,
    windowState,
    onWindowStateChange,
  } = props;
  const config = WINDOW_CONFIG[pageId];

  // If window state isn't initialized yet, don't render
  if (!windowState) return null;

  return (
    <FloatingWindow
      title={config.title}
      isOpen={true}
      onClose={onClose}
      initialPosition={windowState.position}
      initialSize={windowState.size}
      isFullSize={windowState.isFullSize}
      isPinned={isPinned}
      onPinChange={onPinChange}
      onPositionChange={(position) => onWindowStateChange({ position })}
      onSizeChange={(size) => onWindowStateChange({ size })}
      onFullSizeChange={(isFullSize) => onWindowStateChange({ isFullSize })}
    >
      {children[pageId]}
    </FloatingWindow>
  );
}
