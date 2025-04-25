import { useState } from "react";
import { useDocumentService } from "../../../services/documentService";
import { StageItem as StageItemType } from "../../../types/document";
import { StageItem } from "../item/StageItem";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboard } from "../../../context/ClipboardContext";
import styles from "./Stage.module.scss";

interface StageProps {
  showGrid: boolean;
  snapToGrid: boolean;
}

export function Stage({ showGrid, snapToGrid }: StageProps) {
  const { document, documentService } = useDocumentService();
  const { clipboardItem, hasClipboardItem } = useClipboard();

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stageRect, setStageRect] = useState<DOMRect | null>(null);
  const [dragVisualPosition, setDragVisualPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Clear selection when clicking on stage background
  const handleStageClick = (e: React.MouseEvent) => {
    // Only clear if clicking directly on stage (not on an item)
    if (e.target === e.currentTarget) {
      setSelectedItems(new Set());
    }
  };

  // Handle item selection
  const handleItemSelect = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent stage click handler from firing

    // Get current selection
    const newSelectedItems = new Set(selectedItems);

    // Multi-select with Shift key
    if (e.shiftKey) {
      if (newSelectedItems.has(itemId)) {
        newSelectedItems.delete(itemId);
      } else {
        newSelectedItems.add(itemId);
      }
    } else {
      // Single select (replace current selection)
      newSelectedItems.clear();
      newSelectedItems.add(itemId);
    }

    setSelectedItems(newSelectedItems);
  };

  // Clear all items from stage
  const handleClearStage = () => {
    [...document.items].forEach((item) => {
      documentService.removeItem(item.id);
    });
    setSelectedItems(new Set()); // Clear selection when stage is cleared
  };

  // Add a new item at click position
  const handleAddItem = () => {
    if (!contextMenuState.relativePosition) return;

    // Apply grid snapping if enabled
    let posX = contextMenuState.relativePosition.x;
    let posY = contextMenuState.relativePosition.y;

    if (snapToGrid) {
      const { gridSize } = document.stage;
      posX = Math.round(posX / gridSize) * gridSize;
      posY = Math.round(posY / gridSize) * gridSize;
    }

    const newItem: StageItemType = {
      id: crypto.randomUUID(),
      name: "New Item",
      category: "equipment",
      icon: "📦",
      position: {
        x: posX - 30, // Center item on click
        y: posY - 30,
      },
      width: 60,
      height: 60,
    };

    documentService.addItem(newItem);
  };

  // Paste an item from clipboard
  const handlePasteItem = () => {
    if (!clipboardItem || !contextMenuState.relativePosition) return;

    // Apply grid snapping if enabled
    let posX = contextMenuState.relativePosition.x;
    let posY = contextMenuState.relativePosition.y;

    if (snapToGrid) {
      const { gridSize } = document.stage;
      posX = Math.round(posX / gridSize) * gridSize;
      posY = Math.round(posY / gridSize) * gridSize;
    }

    // Create a new item based on the clipboard item but with a new ID
    const newItem: StageItemType = {
      ...clipboardItem,
      id: crypto.randomUUID(),
      position: {
        x: posX - 30, // Center item on click
        y: posY - 30,
      },
    };

    documentService.addItem(newItem);
  };

  // Define menu items for the stage context menu
  const stageMenuItems: MenuItemOrDivider[] = [
    {
      id: "add-item",
      label: "Add Item",
      onClick: handleAddItem,
    },
    ...(hasClipboardItem()
      ? [
          {
            id: "paste",
            label: "Paste",
            onClick: handlePasteItem,
          } as MenuItemOrDivider,
        ]
      : []),
    { type: "divider" as const },
    {
      id: "clear",
      label: "Clear Stage",
      onClick: handleClearStage,
      disabled: document.items.length === 0,
    },
  ];

  // Use the context menu hook
  const {
    handleContextMenu,
    ContextMenu: StageContextMenu,
    contextMenuState,
  } = useContextMenu({
    items: stageMenuItems,
    header: <div className={styles.contextMenuTitle}>Stage Options</div>,
    onElementFilter: (target) => !!target.closest(`.${styles.stageItem}`),
    computeRelativePosition: (e, element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
  });

  // Handle stage item dragging
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    // Skip if right-button
    if (e.button === 2) return;

    const item = document.items.find((item) => item.id === itemId);
    if (!item) return;

    // If shift key is pressed, handle selection instead of dragging
    if (e.shiftKey) {
      handleItemSelect(e, itemId);
      return;
    }

    // If item isn't already selected, select it
    if (!selectedItems.has(itemId)) {
      handleItemSelect(e, itemId);
    }

    // Calculate offset from the mouse to the item's position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Capture the stage's rect at the start of dragging
    const currentStageRect = (e.currentTarget as HTMLElement)
      .closest(`.${styles.stage}`)
      ?.getBoundingClientRect();
    if (currentStageRect) {
      setStageRect(currentStageRect);
    }

    // Initialize visual position to the item's current position
    setDragVisualPosition(item.position);
    setIsDragging(true);
    setDraggedItem(itemId);

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedItem || !stageRect) return;

    // Find the current item to get its dimensions
    const item = document.items.find((item) => item.id === draggedItem);
    if (!item) return;

    const itemWidth = item.width;
    const itemHeight = item.height;

    const newX = e.clientX - stageRect.left - offset.x;
    const newY = e.clientY - stageRect.top - offset.y;

    // Calculate constrained position
    let constrainedX = Math.max(
      0,
      Math.min(document.stage.width - itemWidth, newX)
    );
    let constrainedY = Math.max(
      0,
      Math.min(document.stage.height - itemHeight, newY)
    );

    // Only snap to grid if the snapToGrid option is enabled
    if (snapToGrid) {
      const { gridSize } = document.stage;
      const snappedX = Math.round(constrainedX / gridSize) * gridSize;
      const snappedY = Math.round(constrainedY / gridSize) * gridSize;

      // Make sure snapping doesn't push outside boundaries
      constrainedX = Math.min(document.stage.width - itemWidth, snappedX);
      constrainedY = Math.min(document.stage.height - itemHeight, snappedY);

      setDragVisualPosition({ x: constrainedX, y: constrainedY });
    } else {
      // Free movement but still constrained
      setDragVisualPosition({ x: constrainedX, y: constrainedY });
    }
  };

  const handleOverlayMouseUp = () => {
    if (draggedItem && dragVisualPosition) {
      console.log("Updating document with final position:", dragVisualPosition);
      // Only update the document on mouse up with the final position
      documentService.updateItem(draggedItem, {
        position: dragVisualPosition,
      });
    }

    // Reset drag state
    setIsDragging(false);
    setDraggedItem(null);
    setStageRect(null);
    setDragVisualPosition(null);
  };

  // Delete an item
  const handleDeleteItem = (itemId: string) => {
    documentService.removeItem(itemId);

    // Also remove from selection if present
    if (selectedItems.has(itemId)) {
      const newSelectedItems = new Set(selectedItems);
      newSelectedItems.delete(itemId);
      setSelectedItems(newSelectedItems);
    }
  };

  // Flip an item horizontally
  const handleFlipItem = (itemId: string) => {
    const item = document.items.find((item) => item.id === itemId);
    if (item) {
      documentService.updateItem(itemId, {
        isFlipped: !item.isFlipped,
      });
    }
  };

  return (
    <div
      className={styles.stage}
      style={{
        width: `${document.stage.width}px`,
        height: `${document.stage.height}px`,
        backgroundColor: document.stage.backgroundColor,
      }}
      onContextMenu={handleContextMenu}
      onClick={handleStageClick}
    >
      {/* Grid lines - only show when showGrid is true */}
      {showGrid && (
        <div className={styles.gridContainer}>{/* Grid implementation */}</div>
      )}

      {/* Stage items */}
      {document.items.map((item) => (
        <StageItem
          key={item.id}
          item={item}
          isDragged={item.id === draggedItem}
          isSelected={selectedItems.has(item.id)}
          dragVisualPosition={dragVisualPosition}
          onMouseDown={handleMouseDown}
          onDelete={handleDeleteItem}
          onFlip={handleFlipItem}
        />
      ))}

      {/* Drag overlay - only shown when dragging */}
      {isDragging && (
        <div
          className={styles.dragOverlay}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          onMouseLeave={handleOverlayMouseUp}
        />
      )}

      {/* Stage context menu */}
      <StageContextMenu />
    </div>
  );
}
