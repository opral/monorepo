import { ReactNode, useEffect, useRef, useState, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2, Minimize2, Pin } from "lucide-react";
import { Context } from "../context";

interface FloatingWindowProps {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  isPinned?: boolean;
  onPinChange?: (isPinned: boolean) => void;
  isExpanded?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onExpandedChange?: (isExpanded: boolean) => void;
}

type ResizeDirection = "" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// Snap zones configuration
const EDGE_PADDING = 16; // p-4 equivalent (16px)
const SNAP_THRESHOLD = EDGE_PADDING + 8; // Trigger slightly before the padding edge
const CORNER_THRESHOLD = SNAP_THRESHOLD * 5; // Reduced corner detection area (was 8x)
const EDGE_THRESHOLD = SNAP_THRESHOLD; // Regular edge threshold
const SIDE_EDGE_THRESHOLD = SNAP_THRESHOLD * 3; // Extended threshold for left/right edges
const EXPANDED_MARGIN = EDGE_PADDING * 2; // Margin for expanded mode

const SNAP_ZONES = {
  left: { x: 0, width: 0.5, height: 1, y: 0 },
  right: { x: 0.5, width: 0.5, height: 1, y: 0 },
  bottom: { x: 0, width: 1, height: 0.5, y: 0.5 },
  topLeft: { x: 0, width: 0.5, height: 0.5, y: 0 },
  topRight: { x: 0.5, width: 0.5, height: 0.5, y: 0 },
  bottomLeft: { x: 0, width: 0.5, height: 0.5, y: 0.5 },
  bottomRight: { x: 0.5, width: 0.5, height: 0.5, y: 0.5 },
};

export function FloatingWindow({
  title,
  isOpen,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  isPinned = false,
  onPinChange,
  isExpanded: initialIsExpanded = false,
  onPositionChange,
  onSizeChange,
  onExpandedChange,
}: FloatingWindowProps) {
  const { rootContainer } = useContext(Context);
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>("");
  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);
  const [pinned, setPinned] = useState(isPinned);
  const [isSnapping, setIsSnapping] = useState(false);
  const [snapPreview, setSnapPreview] = useState<null | {
    x: number;
    y: number;
    width: number;
    height: number;
  }>(null);
  const [preSnapSize, setPreSnapSize] = useState<null | {
    width: number;
    height: number;
  }>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use refs for values that don't need to trigger re-renders
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Update position and size refs when state changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Sync with external pinned state
  useEffect(() => {
    setPinned(isPinned);
  }, [isPinned]);

  // Initialize position and size only once
  useEffect(() => {
    if (!hasInitialized) {
      // Use initialPosition and initialSize if provided
      if (initialPosition.x !== 0 || initialPosition.y !== 0) {
        // We have a saved position, use it
        setPosition(initialPosition);
        setSize(initialSize);
      } else {
        // No saved position, calculate a responsive default
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate responsive initial size
        const responsiveWidth = Math.min(
          initialSize.width,
          Math.max(300, viewportWidth * 0.8)
        );
        const responsiveHeight = Math.min(
          initialSize.height,
          Math.max(200, viewportHeight * 0.7)
        );

        // Set responsive size
        setSize({
          width: responsiveWidth,
          height: responsiveHeight,
        });

        // Calculate initial position to center the window
        const newX = Math.max(0, (viewportWidth - responsiveWidth) / 2);
        const newY = Math.max(navbarHeight + 20, (viewportHeight - responsiveHeight) / 3);

        setPosition({ x: newX, y: newY });
      }
      
      setHasInitialized(true);
    }
  }, [initialPosition, initialSize, hasInitialized, navbarHeight]);

  useEffect(() => {
    setIsExpanded(initialIsExpanded);
  }, [initialIsExpanded]);

  // Get the Lix Inspector header height
  useEffect(() => {
    const styleEl = document.getElementById(
      "lix-inspector-style"
    ) as HTMLStyleElement;
    if (styleEl) {
      const headerHeightMatch = styleEl.innerHTML.match(
        /--header-height:\s*(\d+)px/
      );
      if (headerHeightMatch && headerHeightMatch[1]) {
        setHeaderHeight(parseInt(headerHeightMatch[1], 10));
      }
    }

    // Get navbar height
    const navbar = document.querySelector(".navbar") as HTMLElement;
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    } else {
      setNavbarHeight(headerHeight || 42); // Fallback
    }
  }, [headerHeight]);

  // Handle window dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isExpanded || e.button !== 0) return; // Only handle left mouse button

      setIsDragging(true);

      // Calculate offset from cursor to window corner
      const windowRect = windowRef.current?.getBoundingClientRect();
      if (windowRect) {
        dragOffsetRef.current = {
          x: e.clientX - windowRect.left,
          y: e.clientY - windowRect.top,
        };
        e.preventDefault();
      }
    },
    [isExpanded]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (isExpanded) return; // Prevent resizing in expanded mode

      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeDirection(direction);

      // Store initial values
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
      };

      // Also store position for directions that affect position
      dragOffsetRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
    },
    [isExpanded]
  );

  // Check if window should snap to a zone based on cursor position
  const checkSnapping = useCallback(
    (cursorX: number, cursorY: number) => {
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Check proximity to corners with a larger threshold
      const isNearTopLeft =
        cursorX < CORNER_THRESHOLD && cursorY < CORNER_THRESHOLD + headerHeight;
      const isNearTopRight =
        cursorX > viewportWidth - CORNER_THRESHOLD &&
        cursorY < CORNER_THRESHOLD + headerHeight;
      const isNearBottomLeft =
        cursorX < CORNER_THRESHOLD &&
        cursorY > viewportHeight - CORNER_THRESHOLD;
      const isNearBottomRight =
        cursorX > viewportWidth - CORNER_THRESHOLD &&
        cursorY > viewportHeight - CORNER_THRESHOLD;

      // Check proximity of cursor to screen edges - only if not in a corner zone
      const isNearLeft =
        !isNearTopLeft && !isNearBottomLeft && cursorX < SIDE_EDGE_THRESHOLD;
      const isNearRight =
        !isNearTopRight &&
        !isNearBottomRight &&
        cursorX > viewportWidth - SIDE_EDGE_THRESHOLD;
      const isNearBottom =
        !isNearBottomLeft &&
        !isNearBottomRight &&
        cursorY > viewportHeight - EDGE_THRESHOLD;

      // Only check for snapping if cursor is near an edge or corner
      if (
        !isNearLeft &&
        !isNearRight &&
        !isNearBottom &&
        !isNearTopLeft &&
        !isNearTopRight &&
        !isNearBottomLeft &&
        !isNearBottomRight
      ) {
        return null;
      }

      // Determine snap zone based on cursor proximity - prioritize corners
      if (isNearTopLeft) {
        // Top-left corner
        return {
          zone: "topLeft",
          x: EDGE_PADDING,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth * SNAP_ZONES.topLeft.width - EDGE_PADDING * 1.5,
          height:
            viewportHeight * SNAP_ZONES.topLeft.height - EDGE_PADDING * 1.5,
        };
      } else if (isNearTopRight) {
        // Top-right corner
        return {
          zone: "topRight",
          x: viewportWidth * SNAP_ZONES.topRight.x + EDGE_PADDING * 0.5,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth * SNAP_ZONES.topRight.width - EDGE_PADDING * 1.5,
          height:
            viewportHeight * SNAP_ZONES.topRight.height - EDGE_PADDING * 1.5,
        };
      } else if (isNearBottomLeft) {
        // Bottom-left corner
        return {
          zone: "bottomLeft",
          x: EDGE_PADDING,
          y:
            viewportHeight * SNAP_ZONES.bottomLeft.y +
            headerHeight +
            EDGE_PADDING * 0.5,
          width:
            viewportWidth * SNAP_ZONES.bottomLeft.width - EDGE_PADDING * 1.5,
          height:
            viewportHeight * SNAP_ZONES.bottomLeft.height - EDGE_PADDING * 1.5,
        };
      } else if (isNearBottomRight) {
        // Bottom-right corner
        return {
          zone: "bottomRight",
          x: viewportWidth * SNAP_ZONES.bottomRight.x + EDGE_PADDING * 0.5,
          y:
            viewportHeight * SNAP_ZONES.bottomRight.y +
            headerHeight +
            EDGE_PADDING * 0.5,
          width:
            viewportWidth * SNAP_ZONES.bottomRight.width - EDGE_PADDING * 1.5,
          height:
            viewportHeight * SNAP_ZONES.bottomRight.height - EDGE_PADDING * 1.5,
        };
      } else if (isNearLeft) {
        // Left edge
        return {
          zone: "left",
          x: EDGE_PADDING,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth * SNAP_ZONES.left.width - EDGE_PADDING * 1.5,
          height: viewportHeight - EDGE_PADDING * 2 - headerHeight,
        };
      } else if (isNearRight) {
        // Right edge
        return {
          zone: "right",
          x: viewportWidth * SNAP_ZONES.right.x + EDGE_PADDING * 0.5,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth * SNAP_ZONES.right.width - EDGE_PADDING * 1.5,
          height: viewportHeight - EDGE_PADDING * 2 - headerHeight,
        };
      } else if (isNearBottom) {
        // Bottom edge
        return {
          zone: "bottom",
          x: EDGE_PADDING,
          y:
            viewportHeight * SNAP_ZONES.bottom.y +
            headerHeight +
            EDGE_PADDING * 0.5,
          width: viewportWidth - EDGE_PADDING * 2,
          height:
            viewportHeight * SNAP_ZONES.bottom.height - EDGE_PADDING * 1.5,
        };
      }

      return null;
    },
    [headerHeight]
  );

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      // Prevent text selection during drag/resize
      e.preventDefault();

      if (isDragging) {
        // Calculate new position
        const newX = e.clientX - dragOffsetRef.current.x;
        const newY = e.clientY - dragOffsetRef.current.y;

        // Always update position to follow cursor, even when snapping
        setPosition({ x: newX, y: newY });

        // Check if we should snap to a zone
        const snapInfo = checkSnapping(e.clientX, e.clientY);

        if (snapInfo) {
          // Show snap preview
          setIsSnapping(true);
          setSnapPreview({
            x: snapInfo.x,
            y: snapInfo.y,
            width: snapInfo.width,
            height: snapInfo.height,
          });

          // Store pre-snap size if not already stored
          if (!preSnapSize) {
            setPreSnapSize({
              width: sizeRef.current.width,
              height: sizeRef.current.height,
            });
          }
        } else {
          // Clear snap preview
          setIsSnapping(false);
          setSnapPreview(null);
          setPreSnapSize(null);
        }
      } else if (isResizing) {
        // Calculate position and size changes based on resize direction
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newX = positionRef.current.x;
        let newY = positionRef.current.y;

        // Handle width changes
        if (resizeDirection.includes("e")) {
          newWidth = Math.max(200, resizeStartRef.current.width + deltaX);
        } else if (resizeDirection.includes("w")) {
          const widthChange = Math.min(
            deltaX,
            resizeStartRef.current.width - 200
          );
          newWidth = Math.max(200, resizeStartRef.current.width - widthChange);
          newX = resizeStartRef.current.x + widthChange;
        }

        // Handle height changes
        if (resizeDirection.includes("s")) {
          newHeight = Math.max(100, resizeStartRef.current.height + deltaY);
        } else if (resizeDirection.includes("n")) {
          const heightChange = Math.min(
            deltaY,
            resizeStartRef.current.height - 100
          );
          newHeight = Math.max(
            100,
            resizeStartRef.current.height - heightChange
          );
          newY = resizeStartRef.current.y + heightChange;
        }

        // Update position and size
        setPosition({ x: newX, y: newY });
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        if (isSnapping && snapPreview) {
          // Apply snap
          setPosition({ x: snapPreview.x, y: snapPreview.y });
          setSize({ width: snapPreview.width, height: snapPreview.height });
        }

        // Clear states
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection("");
        setIsSnapping(false);
        setSnapPreview(null);
        setPreSnapSize(null);

        // Notify parent components of changes
        if (isDragging && onPositionChange) {
          onPositionChange(positionRef.current);
        }
        if (isResizing && onSizeChange) {
          onSizeChange(sizeRef.current);
        }
      }
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      // Clean up
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    resizeDirection,
    isSnapping,
    snapPreview,
    preSnapSize,
    checkSnapping,
    onPositionChange,
    onSizeChange,
  ]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isExpanded) return; // Don't adjust if expanded

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Ensure window isn't larger than viewport
      let newWidth = size.width;
      let newHeight = size.height;
      let newX = position.x;
      let newY = position.y;
      let needsUpdate = false;

      // Adjust width if needed
      if (newWidth > viewportWidth - 40) {
        newWidth = viewportWidth - 40;
        needsUpdate = true;
      }

      // Adjust height if needed
      if (newHeight > viewportHeight - navbarHeight - 40) {
        newHeight = viewportHeight - navbarHeight - 40;
        needsUpdate = true;
      }

      // Adjust position if window is off-screen
      if (newX + newWidth > viewportWidth - 20) {
        newX = Math.max(20, viewportWidth - newWidth - 20);
        needsUpdate = true;
      }

      if (newY + newHeight > viewportHeight - 20) {
        newY = Math.max(navbarHeight + 20, viewportHeight - newHeight - 20);
        needsUpdate = true;
      }

      // Update if needed
      if (needsUpdate) {
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded, size, position, navbarHeight]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      if (onExpandedChange) {
        onExpandedChange(false);
      }
    } else {
      setIsExpanded(true);
      if (onExpandedChange) {
        onExpandedChange(true);
      }
    }
  }, [isExpanded, position, size, onExpandedChange]);

  // Toggle pin state
  const togglePin = useCallback(() => {
    const newPinned = !pinned;
    setPinned(newPinned);
    if (onPinChange) {
      onPinChange(newPinned);
    }
  }, [pinned, onPinChange]);

  // Render resize handles
  const renderResizeHandles = () => {
    if (isExpanded) return null;

    const handles: ResizeDirection[] = [
      "n",
      "s",
      "e",
      "w",
      "ne",
      "nw",
      "se",
      "sw",
    ];

    return handles.map((dir) => (
      <div
        key={dir}
        className={`resize-handle resize-${dir}`}
        onMouseDown={(e) => handleResizeStart(e, dir)}
        style={{
          position: "absolute",
          ...(dir.includes("n") ? { top: "-3px" } : {}),
          ...(dir.includes("s") ? { bottom: "-3px" } : {}),
          ...(dir.includes("e") ? { right: "-3px" } : {}),
          ...(dir.includes("w") ? { left: "-3px" } : {}),
          ...(dir === "n" || dir === "s"
            ? { left: "6px", right: "6px", height: "6px" }
            : {}),
          ...(dir === "e" || dir === "w"
            ? { top: "6px", bottom: "6px", width: "6px" }
            : {}),
          ...(dir === "ne" || dir === "sw" || dir === "nw" || dir === "se"
            ? { width: "12px", height: "12px" }
            : {}),
          cursor:
            dir === "n" || dir === "s"
              ? "ns-resize"
              : dir === "e" || dir === "w"
                ? "ew-resize"
                : dir === "ne" || dir === "sw"
                  ? "nesw-resize"
                  : "nwse-resize",
          zIndex: 1001,
        }}
      />
    ));
  };

  // Don't render if window is not open
  if (!isOpen) return null;

  // Create the window content
  const windowContent = (
    <>
      {/* Snap preview overlay */}
      {isSnapping && snapPreview && (
        <div
          className="snap-preview bg-primary bg-opacity-20 border-2 border-primary border-dashed rounded-md pointer-events-none"
          style={{
            position: "fixed",
            top: `${snapPreview.y}px`,
            left: `${snapPreview.x}px`,
            width: `${snapPreview.width}px`,
            height: `${snapPreview.height}px`,
            zIndex: 999,
          }}
        />
      )}

      <div
        ref={windowRef}
        className={`floating-window bg-base-100 shadow-lg border border-base-300 rounded-md ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""} ${pinned ? "pinned" : ""}`}
        style={{
          position: "fixed",
          top: isExpanded
            ? `${navbarHeight + 8}px`
            : `${position.y}px`,
          left: isExpanded ? `${EXPANDED_MARGIN}px` : `${position.x}px`,
          width: isExpanded
            ? `calc(100vw - ${EXPANDED_MARGIN * 2}px)`
            : `${size.width}px`,
          height: isExpanded
            ? `calc(100vh - ${navbarHeight + 24}px)`
            : `${size.height}px`,
          maxWidth: isExpanded ? "none" : "calc(100vw - 40px)",
          maxHeight: isExpanded ? "none" : "calc(100vh - 40px)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition:
            isDragging || isResizing ? "none" : "all 0.2s ease-in-out",
          willChange:
            isDragging || isResizing ? "transform, width, height" : "auto",
        }}
      >
        <div
          className="window-header flex justify-between items-center p-2 bg-base-200 cursor-move"
          onMouseDown={handleMouseDown}
          onDoubleClick={toggleExpanded}
        >
          <div className="font-medium">{title}</div>
          <div className="flex items-center gap-1">
            <button
              className={`btn ${pinned ? "btn-primary" : "btn-ghost"} btn-sm p-1 h-6 min-h-0`}
              onClick={togglePin}
              title={pinned ? "Unpin window" : "Pin window"}
            >
              <Pin size={16} strokeWidth={pinned ? 2.5 : 2} />
            </button>
            <button
              className="btn btn-ghost btn-sm p-1 h-6 min-h-0"
              onClick={toggleExpanded}
              title={isExpanded ? "Restore size" : "Expanded"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              className="btn btn-ghost btn-sm p-1 h-6 min-h-0"
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div
          className="window-content p-4 overflow-auto flex-1"
          style={{ height: "calc(100% - 40px)" }}
        >
          {children}
        </div>
        {renderResizeHandles()}
      </div>
    </>
  );

  // Get the shadow root from the container and create portal
  const portalTarget = rootContainer?.shadowRoot;
  
  // Create the portal if we have a target, otherwise return null
  return portalTarget ? createPortal(windowContent, portalTarget) : null;
}
