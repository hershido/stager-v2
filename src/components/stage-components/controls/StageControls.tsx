import clsx from "clsx";
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
        className={clsx(styles.controlIcon, {
          [styles.active]: showGrid,
        })}
        onClick={onToggleGrid}
        title="Toggle Grid Visibility (G)"
      >
        <span role="img" aria-label="Show Grid">
          📏
        </span>
        <div className={styles.shortcutIndicator}>G</div>
      </div>
      <div
        className={clsx(styles.controlIcon, {
          [styles.active]: snapToGrid,
        })}
        onClick={onToggleSnap}
        title="Toggle Snap to Grid (S)"
      >
        <span role="img" aria-label="Snap to Grid">
          🔒
        </span>
        <div className={styles.shortcutIndicator}>S</div>
      </div>
    </div>
  );
}
