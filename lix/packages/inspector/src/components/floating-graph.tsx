import Graph from "../routes/graph/index";
import { FloatingWindow } from "./floating-window";

interface FloatingGraphProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingGraph({ isOpen, onClose }: FloatingGraphProps) {
  return (
    <FloatingWindow
      title="Graph"
      isOpen={isOpen}
      onClose={onClose}
      initialPosition={{ x: 150, y: 150 }}
    >
      <Graph />
    </FloatingWindow>
  );
}
