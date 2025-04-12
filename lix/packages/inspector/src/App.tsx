import { useEffect, useState, useRef } from "react";
import { useLix } from "./hooks/use-lix.ts";
import { openLixInMemory, toBlob } from "@lix-js/sdk";
import { useContext } from "react";
import { Context } from "./context";
import {
  DownloadIcon,
  FileIcon,
  PauseIcon,
  PlayIcon,
  MoreVertical,
  EyeOff,
} from "lucide-react";
import DataExplorer from "./pages/data-explorer/index";
import Graph from "./pages/graph/index";
import { FloatingWindow } from "./components/floating-window";

// Define the types of content that can be displayed
type Pages = "data-explorer" | "graph";

// Inline Lix SVG logo component
const LixLogo = () => (
  <svg
    width="26"
    height="18"
    viewBox="0 0 26 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-1 brightness-0 opacity-60"
  >
    <g id="Group 162">
      <path
        id="Vector"
        d="M14.7618 5.74842L16.9208 9.85984L22.3675 0.358398H25.7133L19.0723 11.6284L22.5712 17.5085H19.2407L16.9208 13.443L14.6393 17.5085H11.2705L14.7618 11.6284L11.393 5.74842H14.7618Z"
        fill="currentColor"
      />
      <path
        id="Vector_2"
        d="M6.16211 17.5081V5.74805H9.42368V17.5081H6.16211Z"
        fill="currentColor"
      />
      <path
        id="Vector_3"
        d="M3.52112 0.393555V17.6416H0.287109V0.393555H3.52112Z"
        fill="currentColor"
      />
      <path
        id="Rectangle 391"
        d="M6.21582 0.393555H14.8399V3.08856H6.21582V0.393555Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

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
  const [isFrozen, setIsFrozen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const transactionRef = useRef<any>(null);
  const [windowStates, setWindowStates] = useState<Record<Pages, WindowState>>(
    {} as Record<Pages, WindowState>
  );

  // Update body padding when the inspector height changes
  useEffect(() => {
    const updateBodyPadding = () => {
      if (isHidden) {
        // Remove padding when hidden
        const styleEl = document.getElementById(
          "lix-inspector-style"
        ) as HTMLStyleElement;
        if (styleEl) {
          styleEl.textContent = `body { padding-top: 0; }`;
        }
        return;
      }

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
  }, [rootContainer, isHidden]);

  // Add keyboard shortcut listener for showing the inspector when hidden
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command+Shift+O to toggle inspector
      if (event.metaKey && event.shiftKey && event.key.toLowerCase() === "o") {
        setIsHidden((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  // Handle freezing and unfreezing of Lix database
  const toggleFreezeState = async () => {
    try {
      if (!isFrozen) {
        // Create a long-running transaction that will block writes
        // We'll keep this transaction open until the user unfreezes
        const transaction = lix.db.transaction();

        // Start a transaction but don't commit or rollback
        // This keeps the transaction open, blocking writes but allowing reads
        transactionRef.current = { transaction, active: true };

        // Execute a simple query to start the transaction
        // but we won't resolve the promise, keeping the transaction open
        transaction
          .execute(async (trx) => {
            // Store the transaction executor in the ref
            transactionRef.current.executor = trx;

            // This promise won't resolve until we manually resolve it when unfreezing
            return new Promise((resolve) => {
              transactionRef.current.resolve = resolve;
            });
          })
          .catch((error) => {
            console.error("Transaction error:", error);
            // If there's an error with the transaction, make sure we unfreeze
            setIsFrozen(false);
            transactionRef.current = null;
          });

        setIsFrozen(true);
      } else {
        // Unfreeze by resolving the transaction promise
        if (transactionRef.current && transactionRef.current.active) {
          // Resolve the promise to complete the transaction
          if (transactionRef.current.resolve) {
            transactionRef.current.resolve();
          }
          transactionRef.current.active = false;
        }
        transactionRef.current = null;
        setIsFrozen(false);
      }
    } catch (error) {
      console.error("Error toggling freeze state:", error);
      // If there's an error, ensure we're in an unfrozen state
      setIsFrozen(false);
      transactionRef.current = null;
    }
  };

  return (
    <div className="flex flex-col w-full" data-theme="light">
      {!isHidden && (
        <header
          className={`bg-background border-b ${
            isFrozen ? "bg-blue-50 border-blue-100" : "border-base-200"
          }`}
        >
          <div className="container mx-auto py-1 px-2 flex items-center">
            <div className="flex items-center mr-4">
              <LixLogo />
              <span className="text-sm font-medium">Inspector</span>
            </div>

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

            <div className="ml-auto flex items-center gap-2">
              {/* Freeze/Unfreeze Button with Tooltip */}
              <div className="tooltip tooltip-bottom">
                <div className="tooltip-content">
                  <div className="font-bold text-xs">
                    {isFrozen ? "Resume Lix" : "Pause Lix"}
                  </div>
                  <div className="text-xs mt-1">
                    {isFrozen
                      ? "Resume write operations"
                      : "Block writes, allow reads"}
                  </div>
                </div>
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={toggleFreezeState}
                >
                  {isFrozen ? (
                    <PlayIcon className="h-4 w-4" />
                  ) : (
                    <PauseIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-xs btn-ghost"
                >
                  <MoreVertical className="h-4 w-4" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-1 p-2 shadow-sm w-56"
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
                  <li>
                    <a onClick={() => setIsHidden(true)}>
                      <div className="flex items-center gap-4">
                        <EyeOff className="h-4 w-4" />
                        Hide Inspector
                        <kbd className="kbd kbd-sm">⌘⇧o</kbd>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Render all visible windows */}
      {!isHidden &&
        visibleWindows.map((pageId) => (
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
