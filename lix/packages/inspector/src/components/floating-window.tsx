import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { X, Maximize2, Minimize2, Pin } from "lucide-react";

interface FloatingWindowProps {
  children: ReactNode;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  isPinned?: boolean;
  onPinChange?: (isPinned: boolean) => void;
  isFullSize?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onFullSizeChange?: (isFullSize: boolean) => void;
}

type ResizeDirection = "" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// Snap zones configuration
const EDGE_PADDING = 16; // p-4 equivalent (16px)
const SNAP_THRESHOLD = EDGE_PADDING + 8; // Trigger slightly before the padding edge
const CORNER_THRESHOLD = SNAP_THRESHOLD * 5; // Reduced corner detection area (was 8x)
const EDGE_THRESHOLD = SNAP_THRESHOLD; // Regular edge threshold
const SIDE_EDGE_THRESHOLD = SNAP_THRESHOLD * 3; // Extended threshold for left/right edges

const SNAP_ZONES = {
  left: { x: 0, width: 0.5, height: 1, y: 0 },
  right: { x: 0.5, width: 0.5, height: 1, y: 0 },
  top: { x: 0, width: 1, height: 0.5, y: 0 },
  bottom: { x: 0, width: 1, height: 0.5, y: 0.5 },
  topLeft: { x: 0, width: 0.5, height: 0.5, y: 0 },
  topRight: { x: 0.5, width: 0.5, height: 0.5, y: 0 },
  bottomLeft: { x: 0, width: 0.5, height: 0.5, y: 0.5 },
  bottomRight: { x: 0.5, width: 0.5, height: 0.5, y: 0.5 },
  maximize: { x: 0, width: 1, height: 1, y: 0 },
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
  isFullSize: initialIsFullSize = false,
  onPositionChange,
  onSizeChange,
  onFullSizeChange,
}: FloatingWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>("");
  const [isFullSize, setIsFullSize] = useState(initialIsFullSize);
  const [previousPosition, setPreviousPosition] = useState(initialPosition);
  const [previousSize, setPreviousSize] = useState(initialSize);
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

  // Update position and size when props change (for saved state)
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setPosition(initialPosition);
    }
  }, [initialPosition, isDragging, isResizing]);

  useEffect(() => {
    if (!isDragging && !isResizing) {
      setSize(initialSize);
    }
  }, [initialSize, isDragging, isResizing]);

  useEffect(() => {
    setIsFullSize(initialIsFullSize);
  }, [initialIsFullSize]);

  // Get the Lix Inspector header height
  useEffect(() => {
    const styleEl = document.getElementById(
      "lix-inspector-style"
    ) as HTMLStyleElement;
    if (styleEl) {
      const match = styleEl.textContent?.match(/padding-top:\s*(\d+)px/);
      if (match && match[1]) {
        setHeaderHeight(parseInt(match[1], 10));
      }
    }
  }, []);

  // Handle dragging - optimized with useCallback
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isFullSize) return; // Prevent dragging in full-size mode

      // Only start dragging from the header (excluding buttons)
      const target = e.target as HTMLElement;
      const isHeader =
        target.classList.contains("window-header") ||
        (target.parentElement &&
          target.parentElement.classList.contains("window-header") &&
          !target.classList.contains("btn") &&
          !target.parentElement.classList.contains("btn"));

      if (isHeader) {
        setIsDragging(true);
        // Store offset in ref to avoid re-renders
        dragOffsetRef.current = {
          x: e.clientX - positionRef.current.x,
          y: e.clientY - positionRef.current.y,
        };

        // Prevent text selection during drag
        e.preventDefault();
      }
    },
    [isFullSize]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      if (isFullSize) return; // Prevent resizing in full-size mode

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
    [isFullSize]
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
      const isNearTop =
        !isNearTopLeft &&
        !isNearTopRight &&
        cursorY < EDGE_THRESHOLD + headerHeight;
      const isNearBottom =
        !isNearBottomLeft &&
        !isNearBottomRight &&
        cursorY > viewportHeight - EDGE_THRESHOLD;

      // Calculate center positions
      const isNearCenterX =
        Math.abs(cursorX - viewportWidth / 2) < EDGE_THRESHOLD;
      const isNearCenterY =
        Math.abs(cursorY - viewportHeight / 2) < EDGE_THRESHOLD;

      // Only check for snapping if cursor is near an edge or corner
      if (
        !isNearLeft &&
        !isNearRight &&
        !isNearTop &&
        !isNearBottom &&
        !isNearTopLeft &&
        !isNearTopRight &&
        !isNearBottomLeft &&
        !isNearBottomRight &&
        !(isNearCenterX && isNearCenterY)
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
          y: viewportHeight * SNAP_ZONES.bottomLeft.y + EDGE_PADDING * 0.5,
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
          y: viewportHeight * SNAP_ZONES.bottomRight.y + EDGE_PADDING * 0.5,
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
          height: viewportHeight - EDGE_PADDING * 2,
        };
      } else if (isNearRight) {
        // Right edge
        return {
          zone: "right",
          x: viewportWidth * SNAP_ZONES.right.x + EDGE_PADDING * 0.5,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth * SNAP_ZONES.right.width - EDGE_PADDING * 1.5,
          height: viewportHeight - EDGE_PADDING * 2,
        };
      } else if (isNearTop) {
        // Top edge
        return {
          zone: "top",
          x: EDGE_PADDING,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth - EDGE_PADDING * 2,
          height: viewportHeight * SNAP_ZONES.top.height - EDGE_PADDING * 1.5,
        };
      } else if (isNearBottom) {
        // Bottom edge
        return {
          zone: "bottom",
          x: EDGE_PADDING,
          y: viewportHeight * SNAP_ZONES.bottom.y + EDGE_PADDING * 0.5,
          width: viewportWidth - EDGE_PADDING * 2,
          height:
            viewportHeight * SNAP_ZONES.bottom.height - EDGE_PADDING * 1.5,
        };
      } else if (isNearCenterX && isNearCenterY) {
        // Center (full screen)
        return {
          zone: "maximize",
          x: EDGE_PADDING,
          y: EDGE_PADDING + headerHeight,
          width: viewportWidth - EDGE_PADDING * 2,
          height: viewportHeight - EDGE_PADDING * 2 - headerHeight,
        };
      }

      // No snap zone detected
      return null;
    },
    [headerHeight]
  );

  // Handle mouse move for both dragging and resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (isDragging) {
          const newPosition = {
            x: e.clientX - dragOffsetRef.current.x,
            y: e.clientY - dragOffsetRef.current.y,
          };

          // Update ref immediately for next move event
          positionRef.current = newPosition;

          // Check for snap zones based on cursor position
          const snapResult = checkSnapping(e.clientX, e.clientY);

          if (snapResult) {
            // If we're not already snapping, save the current size
            if (!isSnapping) {
              setPreSnapSize({
                width: sizeRef.current.width,
                height: sizeRef.current.height,
              });
            }

            setIsSnapping(true);
            setSnapPreview(snapResult);
          } else {
            // If we were snapping but now we're not, restore the pre-snap size if available
            if (isSnapping && preSnapSize) {
              // Immediately update the size ref to avoid race conditions
              sizeRef.current = { ...preSnapSize };
              setSize({ ...preSnapSize });
            }

            setIsSnapping(false);
            setSnapPreview(null);
          }

          // Always update position to follow cursor
          setPosition(newPosition);
        }

        if (isResizing) {
          const deltaX = e.clientX - resizeStartRef.current.x;
          const deltaY = e.clientY - resizeStartRef.current.y;

          let newWidth = resizeStartRef.current.width;
          let newHeight = resizeStartRef.current.height;
          let newX = positionRef.current.x;
          let newY = positionRef.current.y;

          // Handle different resize directions
          if (resizeDirection.includes("e")) {
            newWidth = Math.max(300, resizeStartRef.current.width + deltaX);
          }
          if (resizeDirection.includes("w")) {
            const widthChange =
              resizeStartRef.current.width -
              Math.max(300, resizeStartRef.current.width - deltaX);
            newWidth = resizeStartRef.current.width - widthChange;
            newX = resizeStartRef.current.x + widthChange;
          }
          if (resizeDirection.includes("s")) {
            newHeight = Math.max(200, resizeStartRef.current.height + deltaY);
          }
          if (resizeDirection.includes("n")) {
            const heightChange =
              resizeStartRef.current.height -
              Math.max(200, resizeStartRef.current.height - deltaY);
            newHeight = resizeStartRef.current.height - heightChange;
            newY = resizeStartRef.current.y + heightChange;
          }

          // Update refs for next move event
          sizeRef.current = { width: newWidth, height: newHeight };
          positionRef.current = { x: newX, y: newY };

          // Update state (triggers render)
          setSize({ width: newWidth, height: newHeight });
          setPosition({ x: newX, y: newY });
        }
      });
    },
    [isDragging, isResizing, resizeDirection, checkSnapping]
  );

  // Handle mouse up for both dragging and resizing
  const handleMouseUp = useCallback(() => {
    // If we were snapping, apply the snap
    if (isSnapping && snapPreview) {
      setPosition({ x: snapPreview.x, y: snapPreview.y });
      setSize({ width: snapPreview.width, height: snapPreview.height });

      // Update refs to match
      positionRef.current = { x: snapPreview.x, y: snapPreview.y };
      sizeRef.current = {
        width: snapPreview.width,
        height: snapPreview.height,
      };

      // Notify parent of snapped position and size
      if (onPositionChange) {
        onPositionChange({ x: snapPreview.x, y: snapPreview.y });
      }

      if (onSizeChange) {
        onSizeChange({ width: snapPreview.width, height: snapPreview.height });
      }
    } else if (!isSnapping && preSnapSize) {
      // If we're not snapping anymore but have a pre-snap size, clear it
      setPreSnapSize(null);
    }

    setIsDragging(false);
    setIsResizing(false);
    setIsSnapping(false);
    setSnapPreview(null);
    setResizeDirection("");

    // If not snapping, notify parent of current position and size
    if (!isSnapping) {
      // Notify parent of position change
      if (onPositionChange) {
        onPositionChange(positionRef.current);
      }

      // Notify parent of size change
      if (onSizeChange) {
        onSizeChange(sizeRef.current);
      }
    }
  }, [isSnapping, snapPreview, preSnapSize, onPositionChange, onSizeChange]);

  // Toggle full-size mode
  const toggleFullSize = useCallback(() => {
    const newIsFullSize = !isFullSize;

    if (!isFullSize) {
      // Save current position and size before going full-screen
      setPreviousPosition(positionRef.current);
      setPreviousSize(sizeRef.current);

      // Set full-screen size and position
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const newPosition = { x: 0, y: 0 };
      const newSize = { width: viewportWidth, height: viewportHeight };

      setPosition(newPosition);
      setSize(newSize);
      positionRef.current = newPosition;
      sizeRef.current = newSize;

      // Notify parent of changes
      if (onPositionChange) onPositionChange(newPosition);
      if (onSizeChange) onSizeChange(newSize);
    } else {
      // Restore previous position and size
      setPosition(previousPosition);
      setSize(previousSize);
      positionRef.current = previousPosition;
      sizeRef.current = previousSize;

      // Notify parent of changes
      if (onPositionChange) onPositionChange(previousPosition);
      if (onSizeChange) onSizeChange(previousSize);
    }

    setIsFullSize(newIsFullSize);

    // Notify parent of full-size change
    if (onFullSizeChange) {
      onFullSizeChange(newIsFullSize);
    }
  }, [
    isFullSize,
    previousPosition,
    previousSize,
    onPositionChange,
    onSizeChange,
    onFullSizeChange,
  ]);

  // Toggle pin state
  const togglePin = useCallback(() => {
    const newPinnedState = !pinned;
    setPinned(newPinnedState);

    // Notify parent component if callback is provided
    if (onPinChange) {
      onPinChange(newPinnedState);
    }
  }, [pinned, onPinChange]);

  // Add/remove event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // Add cursor styles to document during drag/resize
      if (isDragging) {
        document.body.style.cursor = "move";
      } else if (isResizing) {
        // Set appropriate cursor based on resize direction
        switch (resizeDirection) {
          case "n":
          case "s":
            document.body.style.cursor = "ns-resize";
            break;
          case "e":
          case "w":
            document.body.style.cursor = "ew-resize";
            break;
          case "ne":
          case "sw":
            document.body.style.cursor = "nesw-resize";
            break;
          case "nw":
          case "se":
            document.body.style.cursor = "nwse-resize";
            break;
        }
      }

      document.body.style.userSelect = "none";
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Reset cursor styles
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, isResizing, resizeDirection, handleMouseMove, handleMouseUp]);

  // Render resize handles
  const renderResizeHandles = () => {
    if (isFullSize) return null;

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

  return (
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
          top: isFullSize ? "0" : `${position.y}px`,
          left: isFullSize ? "0" : `${position.x}px`,
          width: isFullSize ? "100%" : `${size.width}px`,
          height: isFullSize ? "100vh" : `${size.height}px`,
          maxWidth: isFullSize ? "none" : "calc(100vw - 40px)",
          maxHeight: isFullSize ? "none" : "calc(100vh - 40px)",
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
              onClick={toggleFullSize}
              title={isFullSize ? "Restore size" : "Full size"}
            >
              {isFullSize ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
        <div className="window-content p-4 overflow-auto flex-1">
          {children}
        </div>
        {renderResizeHandles()}
      </div>
    </>
  );
}
