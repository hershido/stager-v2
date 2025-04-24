import { useState } from "react";
import { StageItem as StageItemType } from "../../../types/document";
import { ContextMenu, MenuItem } from "../../common/ContextMenu";
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
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
  }>({
    show: false,
    position: { x: 0, y: 0 },
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  // Define menu items for the context menu
  const menuItems: MenuItem[] = [
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
  const menuHeader = (
    <div className={styles.contextMenuHeader}>
      <div className={styles.headerIcon}>{item.icon}</div>
      <div className={styles.headerName}>{item.name}</div>
    </div>
  );

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

      {contextMenu.show && (
        <ContextMenu
          position={contextMenu.position}
          onClose={closeContextMenu}
          header={menuHeader}
          items={menuItems}
        />
      )}
    </>
  );
}
