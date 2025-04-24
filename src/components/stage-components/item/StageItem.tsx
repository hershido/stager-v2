import { StageItem as StageItemType } from "../../../types/document";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboard } from "../../../context/ClipboardContext";
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
  const { copyItem, cutItem } = useClipboard();

  // Define menu items for the item context menu
  const itemMenuItems: MenuItemOrDivider[] = [
    {
      id: "copy",
      label: "Copy",
      onClick: () => copyItem(item),
    },
    {
      id: "cut",
      label: "Cut",
      onClick: () => {
        cutItem(item, onDelete);
      },
    },
    { type: "divider" as const },
    {
      id: "flip",
      label: item.isFlipped ? "Flip Normal" : "Flip Horizontally",
      onClick: () => onFlip(item.id),
    },
    {
      id: "delete",
      label: "Delete",
      onClick: () => onDelete(item.id),
    },
  ];

  // Create a header for the context menu
  const itemHeader = (
    <div className={styles.contextMenuHeader}>
      <div className={styles.headerIcon}>{item.icon}</div>
      <div className={styles.headerName}>{item.name}</div>
    </div>
  );

  // Use the context menu hook
  const { handleContextMenu, ContextMenu: ItemContextMenu } = useContextMenu({
    items: itemMenuItems,
    header: itemHeader,
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
