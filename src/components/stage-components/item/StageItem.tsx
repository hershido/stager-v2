import { StageItem as StageItemType } from "../../../types/document";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboardService } from "../../../services/clipboardService";
import { useDocumentService } from "../../../services/documentService";
import { AlignmentControls } from "../../common/AlignmentControls";
import clsx from "clsx";
import React from "react";
import styles from "./StageItem.module.scss";

// Icon component for keyboard shortcuts
const ShortcutIcon = ({ children }: { children: React.ReactNode }) => (
  <span className={styles.shortcutIcon}>{children}</span>
);

interface StageItemProps {
  item: StageItemType;
  isDragged: boolean;
  isSelected?: boolean;
  isDuplicating?: boolean;
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
  isDuplicating = false,
  dragVisualPosition,
  onMouseDown,
  onDelete,
  onFlip,
  selectedItemsCount = 0,
  getSelectedItems = () => [],
}: StageItemProps) {
  const { clipboardService } = useClipboardService();
  const { copyItem, copyItems, cutItem, cutItems } = clipboardService;
  const { document, documentService } = useDocumentService();

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

  // Alignment handlers
  const handleAlignLeft = () => {
    if (isMultiSelected) {
      // Align to leftmost item in selection
      const items = getSelectedItems();
      const leftmost = Math.min(...items.map((i) => i.position.x));

      items.forEach((selectedItem) => {
        documentService.updateItem(selectedItem.id, {
          position: {
            ...selectedItem.position,
            x: leftmost,
          },
        });
      });
    } else {
      // Align to left edge of stage
      documentService.updateItem(item.id, {
        position: {
          ...item.position,
          x: 0,
        },
      });
    }
  };

  const handleAlignCenter = () => {
    if (isMultiSelected) {
      // Find center of selection
      const items = getSelectedItems();
      const bounds = getBoundsOfItems(items);
      const centerX = bounds.left + bounds.width / 2;

      items.forEach((selectedItem) => {
        const itemCenterOffset = (selectedItem.width || 0) / 2;
        documentService.updateItem(selectedItem.id, {
          position: {
            ...selectedItem.position,
            x: centerX - itemCenterOffset,
          },
        });
      });
    } else {
      // Center horizontally on stage
      const stageWidth = document.stage.width;
      const itemWidth = item.width || 0;
      documentService.updateItem(item.id, {
        position: {
          ...item.position,
          x: (stageWidth - itemWidth) / 2,
        },
      });
    }
  };

  const handleAlignRight = () => {
    if (isMultiSelected) {
      // Align to rightmost item in selection
      const items = getSelectedItems();
      const rightEdges = items.map((i) => i.position.x + (i.width || 0));
      const rightmost = Math.max(...rightEdges);

      items.forEach((selectedItem) => {
        documentService.updateItem(selectedItem.id, {
          position: {
            ...selectedItem.position,
            x: rightmost - (selectedItem.width || 0),
          },
        });
      });
    } else {
      // Align to right edge of stage
      const stageWidth = document.stage.width;
      const itemWidth = item.width || 0;
      documentService.updateItem(item.id, {
        position: {
          ...item.position,
          x: stageWidth - itemWidth,
        },
      });
    }
  };

  const handleAlignTop = () => {
    if (isMultiSelected) {
      // Align to topmost item in selection
      const items = getSelectedItems();
      const topmost = Math.min(...items.map((i) => i.position.y));

      items.forEach((selectedItem) => {
        documentService.updateItem(selectedItem.id, {
          position: {
            ...selectedItem.position,
            y: topmost,
          },
        });
      });
    } else {
      // Align to top edge of stage
      documentService.updateItem(item.id, {
        position: {
          ...item.position,
          y: 0,
        },
      });
    }
  };

  const handleAlignMiddle = () => {
    if (isMultiSelected) {
      // Find vertical center of selection
      const items = getSelectedItems();
      const bounds = getBoundsOfItems(items);
      const middleY = bounds.top + bounds.height / 2;

      items.forEach((selectedItem) => {
        const itemMiddleOffset = (selectedItem.height || 0) / 2;
        documentService.updateItem(selectedItem.id, {
          position: {
            ...selectedItem.position,
            y: middleY - itemMiddleOffset,
          },
        });
      });
    } else {
      // Center vertically on stage
      const stageHeight = document.stage.height;
      const itemHeight = item.height || 0;
      documentService.updateItem(item.id, {
        position: {
          ...item.position,
          y: (stageHeight - itemHeight) / 2,
        },
      });
    }
  };

  const handleAlignBottom = () => {
    if (isMultiSelected) {
      // Align to bottommost item in selection
      const items = getSelectedItems();
      const bottomEdges = items.map((i) => i.position.y + (i.height || 0));
      const bottommost = Math.max(...bottomEdges);

      items.forEach((selectedItem) => {
        documentService.updateItem(selectedItem.id, {
          position: {
            ...selectedItem.position,
            y: bottommost - (selectedItem.height || 0),
          },
        });
      });
    } else {
      // Align to bottom edge of stage
      const stageHeight = document.stage.height;
      const itemHeight = item.height || 0;
      documentService.updateItem(item.id, {
        position: {
          ...item.position,
          y: stageHeight - itemHeight,
        },
      });
    }
  };

  // Distribution handlers - only applicable for 3 or more items
  const handleDistributeHorizontally = () => {
    if (selectedItemsCount >= 3) {
      const items = getSelectedItems();

      // Sort items by x position
      const sortedItems = [...items].sort(
        (a, b) => a.position.x - b.position.x
      );

      // Find leftmost and rightmost positions
      const leftItem = sortedItems[0];
      const rightItem = sortedItems[sortedItems.length - 1];
      const leftEdge = leftItem.position.x;
      const rightEdge = rightItem.position.x + (rightItem.width || 0);
      const totalWidth = rightEdge - leftEdge;

      // Calculate space between items
      const totalItemWidth = sortedItems.reduce(
        (sum, item) => sum + (item.width || 0),
        0
      );
      const spaceBetween =
        (totalWidth - totalItemWidth) / (sortedItems.length - 1);

      let currentX = leftItem.position.x + (leftItem.width || 0) + spaceBetween;

      // Skip first and last items as they stay in place
      for (let i = 1; i < sortedItems.length - 1; i++) {
        const currentItem = sortedItems[i];
        documentService.updateItem(currentItem.id, {
          position: {
            ...currentItem.position,
            x: currentX,
          },
        });
        currentX += (currentItem.width || 0) + spaceBetween;
      }
    }
  };

  const handleDistributeVertically = () => {
    if (selectedItemsCount >= 3) {
      const items = getSelectedItems();

      // Sort items by y position
      const sortedItems = [...items].sort(
        (a, b) => a.position.y - b.position.y
      );

      // Find topmost and bottommost positions
      const topItem = sortedItems[0];
      const bottomItem = sortedItems[sortedItems.length - 1];
      const topEdge = topItem.position.y;
      const bottomEdge = bottomItem.position.y + (bottomItem.height || 0);
      const totalHeight = bottomEdge - topEdge;

      // Calculate space between items
      const totalItemHeight = sortedItems.reduce(
        (sum, item) => sum + (item.height || 0),
        0
      );
      const spaceBetween =
        (totalHeight - totalItemHeight) / (sortedItems.length - 1);

      let currentY = topItem.position.y + (topItem.height || 0) + spaceBetween;

      // Skip first and last items as they stay in place
      for (let i = 1; i < sortedItems.length - 1; i++) {
        const currentItem = sortedItems[i];
        documentService.updateItem(currentItem.id, {
          position: {
            ...currentItem.position,
            y: currentY,
          },
        });
        currentY += (currentItem.height || 0) + spaceBetween;
      }
    }
  };

  // Helper function to get bounds of a set of items
  const getBoundsOfItems = (items: StageItemType[]) => {
    const left = Math.min(...items.map((i) => i.position.x));
    const top = Math.min(...items.map((i) => i.position.y));
    const right = Math.max(...items.map((i) => i.position.x + (i.width || 0)));
    const bottom = Math.max(
      ...items.map((i) => i.position.y + (i.height || 0))
    );

    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
    };
  };

  // Handle duplicate items
  const handleDuplicateItems = () => {
    if (isMultiSelected) {
      // Duplicate all selected items
      const items = getSelectedItems();
      items.forEach((selectedItem) => {
        // Create a duplicate with offset position
        const newItem: StageItemType = {
          ...selectedItem,
          id: crypto.randomUUID(),
          position: {
            x: selectedItem.position.x + 20,
            y: selectedItem.position.y + 20,
          },
        };
        documentService.addItem(newItem);
      });
    } else {
      // Duplicate single item
      const newItem: StageItemType = {
        ...item,
        id: crypto.randomUUID(),
        position: {
          x: item.position.x + 20,
          y: item.position.y + 20,
        },
      };
      documentService.addItem(newItem);
    }
  };

  // Define menu items for the item context menu
  const itemMenuItems: MenuItemOrDivider[] = [
    {
      id: "copy",
      label: "Copy",
      shortcut: (
        <>
          <ShortcutIcon>⌘</ShortcutIcon>C
        </>
      ),
      onClick: handleCopyItems,
    },
    {
      id: "cut",
      label: "Cut",
      shortcut: (
        <>
          <ShortcutIcon>⌘</ShortcutIcon>X
        </>
      ),
      onClick: handleCutItems,
    },
    {
      id: "duplicate",
      label: "Duplicate",
      shortcut: (
        <>
          <ShortcutIcon>⌘</ShortcutIcon>D
        </>
      ),
      onClick: handleDuplicateItems,
    },
    { type: "divider" as const },
    {
      id: "alignment",
      label: "Alignment",
      content: (
        <AlignmentControls
          onAlignLeft={handleAlignLeft}
          onAlignCenter={handleAlignCenter}
          onAlignRight={handleAlignRight}
          onAlignTop={handleAlignTop}
          onAlignMiddle={handleAlignMiddle}
          onAlignBottom={handleAlignBottom}
          showDistribution={selectedItemsCount > 2}
          onDistributeHorizontal={
            selectedItemsCount > 2 ? handleDistributeHorizontally : undefined
          }
          onDistributeVertical={
            selectedItemsCount > 2 ? handleDistributeVertically : undefined
          }
        />
      ),
      onClick: () => {},
      custom: true,
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
      shortcut: "Del",
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
          [styles.duplicating]: isDuplicating,
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
