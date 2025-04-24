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
  return (
    <div className={styles.stageControls}>
      <div
        className={`${styles.controlIcon} ${showGrid ? styles.active : ""}`}
        onClick={onToggleGrid}
        title="Toggle Grid Visibility"
      >
        <span role="img" aria-label="Show Grid">
          📏
        </span>
      </div>
      <div
        className={`${styles.controlIcon} ${snapToGrid ? styles.active : ""}`}
        onClick={onToggleSnap}
        title="Toggle Snap to Grid"
      >
        <span role="img" aria-label="Snap to Grid">
          🔒
        </span>
      </div>
    </div>
  );
}
