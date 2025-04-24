import { useState, useEffect, useRef } from "react";
import { useDocumentService } from "../../../services/documentService";
import { StageItem as StageItemType } from "../../../types/document";
import { StageItem } from "../item/StageItem";
import { ContextMenu, MenuItem } from "../../common/ContextMenu";
import styles from "./Stage.module.scss";

interface StageProps {
  showGrid: boolean;
  snapToGrid: boolean;
}

export function Stage({ showGrid, snapToGrid }: StageProps) {
  const { document, documentService } = useDocumentService();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stageRect, setStageRect] = useState<DOMRect | null>(null);
  const [dragVisualPosition, setDragVisualPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const hasAddedMockItem = useRef(false);

  // State for the stage context menu
  const [stageContextMenu, setStageContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    stagePosition: { x: number; y: number };
  }>({
    show: false,
    position: { x: 0, y: 0 },
    stagePosition: { x: 0, y: 0 },
  });

  // Add a mock item if none exist
  useEffect(() => {
    // Only add mock item if we haven't added one yet and there are no items
    if (document.items.length === 0 && !hasAddedMockItem.current) {
      const mockItem: StageItemType = {
        id: crypto.randomUUID(),
        name: "Sample Item",
        category: "equipment",
        icon: "🎸",
        position: {
          x: document.stage.width / 2 - 30,
          y: document.stage.height / 2 - 30,
        },
        width: 100,
        height: 100,
      };

      documentService.addItem(mockItem);
      const mockItem2: StageItemType = {
        id: crypto.randomUUID(),
        name: "Sample Item",
        category: "equipment",
        icon: "🎹",
        position: {
          x: document.stage.width / 2 - 30,
          y: document.stage.height / 2 - 30,
        },
        width: 100,
        height: 100,
      };

      documentService.addItem(mockItem2);
      hasAddedMockItem.current = true;
    }
  }, [
    document.items.length,
    document.stage.width,
    document.stage.height,
    documentService,
  ]);

  // Handle stage item dragging
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    // Skip if right-button
    if (e.button === 2) return;

    const item = document.items.find((item) => item.id === itemId);
    if (!item) return;

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

  // Handle background context menu
  const handleStageContextMenu = (e: React.MouseEvent) => {
    // Only show context menu when clicking on stage background, not on items
    if ((e.target as HTMLElement).closest(`.${styles.stageItem}`)) return;

    e.preventDefault();

    // Get the stage element and its rect
    const stageElement = e.currentTarget as HTMLElement;
    const currentStageRect = stageElement.getBoundingClientRect();

    // Calculate stage-relative coordinates
    const stagePosition = {
      x: e.clientX - currentStageRect.left,
      y: e.clientY - currentStageRect.top,
    };

    setStageContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      stagePosition,
    });
  };

  // Add a new item at click position
  const handleAddItem = () => {
    const { stagePosition } = stageContextMenu;

    // Apply grid snapping if enabled
    let posX = stagePosition.x;
    let posY = stagePosition.y;

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

  // Clear all items from stage
  const handleClearStage = () => {
    // You would need to add a method to documentService to handle this
    // For now we'll just remove each item
    [...document.items].forEach((item) => {
      documentService.removeItem(item.id);
    });
  };

  // Define menu items for the stage context menu
  const stageMenuItems: MenuItem[] = [
    {
      id: "add-item",
      label: "Add Item Here",
      onClick: handleAddItem,
    },
    {
      id: "clear",
      label: "Clear Stage",
      onClick: handleClearStage,
      disabled: document.items.length === 0,
    },
  ];

  return (
    <div
      className={styles.stage}
      style={{
        width: `${document.stage.width}px`,
        height: `${document.stage.height}px`,
        backgroundColor: document.stage.backgroundColor,
      }}
      onContextMenu={handleStageContextMenu}
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
      {stageContextMenu.show && (
        <ContextMenu
          position={stageContextMenu.position}
          onClose={() =>
            setStageContextMenu({ ...stageContextMenu, show: false })
          }
          header={<div className={styles.contextMenuTitle}>Stage Options</div>}
          items={stageMenuItems}
        />
      )}
    </div>
  );
}
