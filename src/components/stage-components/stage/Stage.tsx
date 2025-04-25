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

// Type to track initial positions of items when dragging starts
interface DraggedItemsInitialState {
  [itemId: string]: { x: number; y: number };
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

  // Track initial positions of all selected items when drag starts
  const [initialItemPositions, setInitialItemPositions] =
    useState<DraggedItemsInitialState>({});

  // Track all items' current visual positions during drag
  const [selectedItemsPositions, setSelectedItemsPositions] = useState<{
    [itemId: string]: { x: number; y: number } | null;
  }>({});

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

    // If item isn't already selected, select just this item
    // This preserves multi-selection when starting to drag a selected item
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

    // Save initial positions of all selected items
    const initialPositions: DraggedItemsInitialState = {};
    const positions: { [id: string]: { x: number; y: number } | null } = {};

    // If dragging a selected item, save positions of all selected items
    if (selectedItems.has(itemId)) {
      document.items.forEach((item) => {
        if (selectedItems.has(item.id)) {
          initialPositions[item.id] = { ...item.position };
          positions[item.id] = { ...item.position };
        }
      });
    } else {
      // If dragging a non-selected item, just save its position
      initialPositions[itemId] = { ...item.position };
      positions[itemId] = { ...item.position };
    }

    setInitialItemPositions(initialPositions);
    setSelectedItemsPositions(positions);

    // Set dragging state
    setDraggedItem(itemId);
    setIsDragging(true);

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
    }

    // Update the dragged item position
    setDraggedItem(draggedItem);

    // Calculate movement delta from initial position
    const initialPos = initialItemPositions[draggedItem];
    if (!initialPos) return;

    const deltaX = constrainedX - initialPos.x;
    const deltaY = constrainedY - initialPos.y;

    // Update positions of all selected items
    const newPositions = { ...selectedItemsPositions };

    Object.keys(initialItemPositions).forEach((id) => {
      if (id === draggedItem) {
        newPositions[id] = { x: constrainedX, y: constrainedY };
      } else if (selectedItems.has(id)) {
        // Apply the same delta to other selected items
        const initialItemPos = initialItemPositions[id];
        if (initialItemPos) {
          const item = document.items.find((item) => item.id === id);
          if (item) {
            // Apply constraints to ensure items stay within stage boundaries
            const newX = Math.max(
              0,
              Math.min(
                document.stage.width - (item.width || 60),
                initialItemPos.x + deltaX
              )
            );
            const newY = Math.max(
              0,
              Math.min(
                document.stage.height - (item.height || 60),
                initialItemPos.y + deltaY
              )
            );

            // Apply grid snapping if enabled
            let finalX = newX;
            let finalY = newY;

            if (snapToGrid) {
              const { gridSize } = document.stage;
              finalX = Math.round(newX / gridSize) * gridSize;
              finalY = Math.round(newY / gridSize) * gridSize;

              // Final boundary check after snapping
              finalX = Math.min(
                document.stage.width - (item.width || 60),
                finalX
              );
              finalY = Math.min(
                document.stage.height - (item.height || 60),
                finalY
              );
            }

            newPositions[id] = { x: finalX, y: finalY };
          }
        }
      }
    });

    setSelectedItemsPositions(newPositions);
  };

  const handleOverlayMouseUp = () => {
    if (isDragging) {
      // Update all selected items' positions in the document
      Object.entries(selectedItemsPositions).forEach(([itemId, position]) => {
        if (position) {
          documentService.updateItem(itemId, { position });
        }
      });
    }

    // Reset drag state
    setIsDragging(false);
    setDraggedItem(null);
    setStageRect(null);
    setInitialItemPositions({});
    setSelectedItemsPositions({});
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
          isDragged={isDragging && selectedItems.has(item.id)}
          isSelected={selectedItems.has(item.id)}
          dragVisualPosition={
            isDragging && selectedItemsPositions[item.id]
              ? selectedItemsPositions[item.id]
              : null
          }
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
