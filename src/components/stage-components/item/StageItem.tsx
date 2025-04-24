import { StageItem as StageItemType } from "../../../types/document";
import styles from "./StageItem.module.scss";

interface StageItemProps {
  item: StageItemType;
  isDragged: boolean;
  dragVisualPosition: { x: number; y: number } | null;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

export function StageItem({
  item,
  isDragged,
  dragVisualPosition,
  onMouseDown,
}: StageItemProps) {
  // Determine position - use visual position for dragged item
  const position =
    isDragged && dragVisualPosition ? dragVisualPosition : item.position;

  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: item.width ? `${item.width}px` : "auto",
    height: item.height ? `${item.height}px` : "auto",
    transform: item.isFlipped ? "scaleX(-1)" : undefined,
  };

  return (
    <div
      className={styles.stageItem}
      style={style}
      onMouseDown={(e) => onMouseDown(e, item.id)}
    >
      <div className={styles.itemContent}>
        <div className={styles.itemIcon}>
          {item.icon ? <span>{item.icon}</span> : "□"}
        </div>
        <div className={styles.itemName}>{item.name}</div>
      </div>
    </div>
  );
}
