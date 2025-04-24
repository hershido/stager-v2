import { StageItem as StageItemType } from "../../../types/document";
import { useItemContextMenu } from "./hooks/useItemContextMenu";
import styles from "./StageItem.module.scss";

interface StageItemProps {
  item: StageItemType;
  isDragged: boolean;
  dragVisualPosition: { x: number; y: number } | null;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onDelete: (itemId: string) => void;
  onFlip: (itemId: string) => void;
}

export function StageItem({
  item,
  isDragged,
  dragVisualPosition,
  onMouseDown,
  onDelete,
  onFlip,
}: StageItemProps) {
  // Use the item context menu hook
  const { handleContextMenu, ItemContextMenu } = useItemContextMenu({
    itemId: item.id,
    itemName: item.name,
    itemIcon: item.icon,
    isFlipped: !!item.isFlipped,
    onFlip,
    onDelete,
  });

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
    <>
      <div
        className={styles.stageItem}
        style={style}
        onMouseDown={(e) => onMouseDown(e, item.id)}
        onContextMenu={handleContextMenu}
      >
        <div className={styles.itemContent}>
          <div className={styles.itemIcon}>
            {item.icon ? <span>{item.icon}</span> : "□"}
          </div>
          <div className={styles.itemName}>{item.name}</div>
        </div>
      </div>

      {/* Item context menu */}
      <ItemContextMenu />
    </>
  );
}
