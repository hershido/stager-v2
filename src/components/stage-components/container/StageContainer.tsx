import { useState, useCallback } from "react";
import { Stage } from "../stage/Stage";
import { StageControls } from "../controls/StageControls";
import styles from "./StageContainer.module.scss";

export function StageContainer() {
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Toggle functions for grid visibility and snap-to-grid
  const toggleShowGrid = () => setShowGrid((prev) => !prev);
  const toggleSnapToGrid = () => setSnapToGrid((prev) => !prev);

  // Handle keyboard shortcuts for grid and snap toggles
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only handle these shortcuts if they're not in an input element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Prevent interference with existing shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // G key for toggling grid visibility
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        toggleShowGrid();
        console.log(`Grid visibility ${!showGrid ? "enabled" : "disabled"}`);
      }

      // S key for toggling snap to grid
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        toggleSnapToGrid();
        console.log(`Snap to grid ${!snapToGrid ? "enabled" : "disabled"}`);
      }
    },
    [showGrid, snapToGrid]
  );

  return (
    <div
      className={styles.stageContainer}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <StageControls
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        onToggleGrid={toggleShowGrid}
        onToggleSnap={toggleSnapToGrid}
      />
      <Stage showGrid={showGrid} snapToGrid={snapToGrid} />
    </div>
  );
}
