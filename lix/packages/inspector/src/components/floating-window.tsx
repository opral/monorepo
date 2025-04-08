import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { X, Maximize2, Minimize2, Pin } from "lucide-react";

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  isPinned?: boolean;
  onPinChange?: (isPinned: boolean) => void;
}

type ResizeDirection = "" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function FloatingWindow({
  title,
  isOpen,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 },
  isPinned = false,
  onPinChange,
}: FloatingWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>("");
  const [isFullSize, setIsFullSize] = useState(false);
  const [previousPosition, setPreviousPosition] = useState(initialPosition);
  const [previousSize, setPreviousSize] = useState(initialSize);
  const [pinned, setPinned] = useState(isPinned);

  // Use refs for values that don't need to trigger re-renders
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Update the refs when position or size changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Update pinned state when prop changes
  useEffect(() => {
    setPinned(isPinned);
  }, [isPinned]);

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

          // Update state (triggers render)
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
    [isDragging, isResizing, resizeDirection]
  );

  // Handle mouse up for both dragging and resizing
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const toggleFullSize = useCallback(() => {
    if (isFullSize) {
      // Return to previous position and size
      setPosition(previousPosition);
      setSize(previousSize);
    } else {
      // Save current position and size before going full-size
      setPreviousPosition(position);
      setPreviousSize(size);
    }
    setIsFullSize(!isFullSize);
  }, [isFullSize, position, previousPosition, size, previousSize]);

  // Toggle pin state
  const togglePin = useCallback(() => {
    const newPinnedState = !pinned;
    setPinned(newPinnedState);

    // Notify parent component if callback is provided
    if (onPinChange) {
      onPinChange(newPinnedState);
    }
  }, [pinned, onPinChange]);

  // Add and remove event listeners with cleanup
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

  // Create resize handles
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

  if (!isOpen) return null;

  return (
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
        transition: isDragging || isResizing ? "none" : "all 0.2s ease-in-out",
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
      <div className="window-content p-4 overflow-auto flex-1">{children}</div>
      {renderResizeHandles()}
    </div>
  );
}
