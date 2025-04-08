import { ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
}

export function FloatingWindow({
  title,
  isOpen,
  onClose,
  children,
  initialPosition = { x: 100, y: 100 },
}: FloatingWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current && e.target === windowRef.current.querySelector(".window-header")) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className="floating-window bg-base-100 shadow-lg border border-base-300 rounded-md"
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: "80%",
        maxWidth: "1200px",
        maxHeight: "80vh",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="window-header flex justify-between items-center p-2 bg-base-200 cursor-move"
      >
        <div className="font-medium">{title}</div>
        <button
          className="btn btn-ghost btn-sm p-1 h-6 min-h-0"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      <div className="window-content p-4 overflow-auto">{children}</div>
    </div>
  );
}
