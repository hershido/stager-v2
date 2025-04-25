import { StageItem as StageItemType } from "../../../types/document";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboard } from "../../../context/ClipboardContext";
import clsx from "clsx";
import styles from "./StageItem.module.scss";

interface StageItemProps {
  item: StageItemType;
  isDragged: boolean;
  isSelected?: boolean;
  dragVisualPosition: { x: number; y: number } | null;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onDelete: (itemId: string) => void;
  onFlip: (itemId: string) => void;
  selectedItemsCount?: number;
  getSelectedItems?: () => StageItemType[];
}

export function StageItem({
  item,
  isDragged,
  isSelected = false,
  dragVisualPosition,
  onMouseDown,
  onDelete,
  onFlip,
  selectedItemsCount = 0,
  getSelectedItems = () => [],
}: StageItemProps) {
  const { copyItem, copyItems, cutItem, cutItems } = useClipboard();

  const isMultiSelected = isSelected && selectedItemsCount > 1;

  const handleCopyItems = () => {
    if (isMultiSelected) {
      // Get all selected items and copy them
      const items = getSelectedItems();
      copyItems(items);
    } else {
      copyItem(item);
    }
  };

  const handleCutItems = () => {
    if (isMultiSelected) {
      // Get all selected items and cut them
      const items = getSelectedItems();
      cutItems(items, onDelete);
    } else {
      cutItem(item, onDelete);
    }
  };

  const handleDeleteItems = () => {
    if (isMultiSelected) {
      // Delete all selected items
      const items = getSelectedItems();
      items.forEach((selectedItem) => {
        onDelete(selectedItem.id);
      });
    } else {
      onDelete(item.id);
    }
  };

  const handleFlipItems = () => {
    if (isMultiSelected) {
      // Flip all selected items
      const items = getSelectedItems();
      items.forEach((selectedItem) => {
        onFlip(selectedItem.id);
      });
    } else {
      onFlip(item.id);
    }
  };

  // Define menu items for the item context menu
  const itemMenuItems: MenuItemOrDivider[] = [
    {
      id: "copy",
      label: "Copy",
      onClick: handleCopyItems,
    },
    {
      id: "cut",
      label: "Cut",
      onClick: handleCutItems,
    },
    { type: "divider" as const },
    {
      id: "flip",
      label: "Flip",
      onClick: handleFlipItems,
    },
    {
      id: "delete",
      label: "Delete",
      onClick: handleDeleteItems,
    },
  ];

  // Create a header for the context menu
  const itemHeader = (
    <div className={styles.contextMenuHeader}>
      <div className={styles.headerIcon}>
        {isMultiSelected ? "📑" : item.icon}
      </div>
      <div className={styles.headerName}>
        {isMultiSelected ? `${selectedItemsCount} Items Selected` : item.name}
      </div>
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
        className={clsx(styles.stageItem, {
          [styles.selected]: isSelected,
        })}
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
