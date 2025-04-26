import clsx from "clsx";
import React from "react";
import styles from "./StageControls.module.scss";

interface StageControlsProps {
  showGrid: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
}

export function StageControls({
  showGrid,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
}: StageControlsProps) {
  // Handle button click and refocus the stage container
  const handleGridToggle = (e: React.MouseEvent) => {
    onToggleGrid();
    // Find and focus the parent container with tabIndex
    const container = (e.currentTarget as HTMLElement).closest(
      '[tabindex="0"]'
    );
    if (container) {
      (container as HTMLElement).focus();
    }
  };

  const handleSnapToggle = (e: React.MouseEvent) => {
    onToggleSnap();
    // Find and focus the parent container with tabIndex
    const container = (e.currentTarget as HTMLElement).closest(
      '[tabindex="0"]'
    );
    if (container) {
      (container as HTMLElement).focus();
    }
  };

  return (
    <div className={styles.stageControls}>
      <div
        className={clsx(styles.controlIcon, {
          [styles.active]: showGrid,
        })}
        onClick={handleGridToggle}
        title="Toggle Grid Visibility (G)"
      >
        <span role="img" aria-label="Show Grid">
          📏
        </span>
      </div>
      <div
        className={clsx(styles.controlIcon, {
          [styles.active]: snapToGrid,
        })}
        onClick={handleSnapToggle}
        title="Toggle Snap to Grid (S)"
      >
        <span role="img" aria-label="Snap to Grid">
          🔒
        </span>
      </div>
    </div>
  );
}
