import { useState } from "react";
import { Stage } from "../stage/Stage";
import { StageControls } from "../controls/StageControls";
import styles from "./StageContainer.module.scss";

export function StageContainer() {
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Toggle functions for grid visibility and snap-to-grid
  const toggleShowGrid = () => setShowGrid((prev) => !prev);
  const toggleSnapToGrid = () => setSnapToGrid((prev) => !prev);

  return (
    <div className={styles.stageContainer}>
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
