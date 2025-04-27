import { useState, useRef, useCallback, useEffect } from "react";
import { Stage } from "../stage/Stage";
import { StageControls } from "../controls/StageControls";
import { useShortcut } from "../../../contexts/KeyboardContext";
import styles from "./StageContainer.module.scss";

export function StageContainer() {
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle functions for grid visibility and snap-to-grid
  const toggleShowGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
    console.log(`Grid visibility ${!showGrid ? "enabled" : "disabled"}`);
  }, [showGrid]);

  const toggleSnapToGrid = useCallback(() => {
    setSnapToGrid((prev) => !prev);
    console.log(`Snap to grid ${!snapToGrid ? "enabled" : "disabled"}`);
  }, [snapToGrid]);

  // Log when the component mounts to verify shortcut registration timing
  useEffect(() => {
    console.log("StageContainer mounted - registering shortcuts");
    return () =>
      console.log(
        "StageContainer unmounted - shortcuts should be unregistered"
      );
  }, []);

  // Register keyboard shortcuts using our hook
  // G key for toggling grid visibility
  useShortcut(
    "g",
    (e) => {
      console.log("G shortcut triggered!");
      e.preventDefault();
      toggleShowGrid();
    },
    [toggleShowGrid],
    { priority: 10 }
  ); // Higher priority to ensure it takes precedence

  // S key for toggling snap to grid
  useShortcut(
    "s",
    (e) => {
      console.log("S shortcut triggered!");
      e.preventDefault();
      toggleSnapToGrid();
    },
    [toggleSnapToGrid],
    { priority: 10 }
  ); // Higher priority to ensure it takes precedence

  // Log out which shortcuts are active in this component
  console.log("StageContainer shortcuts: g, s");

  return (
    <div ref={containerRef} className={styles.stageContainer} tabIndex={0}>
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
