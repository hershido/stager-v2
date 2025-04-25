import { useDocumentService } from "../../../services/documentService";
import { StageItem as StageItemType } from "../../../types/document";
import { StageItem } from "../item/StageItem";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboard } from "../../../context/ClipboardContext";
import { useStageState } from "./hooks/useStageState";
import styles from "./Stage.module.scss";
import React, { useRef, useCallback } from "react";

interface StageProps {
  showGrid: boolean;
  snapToGrid: boolean;
}

export function Stage({ showGrid, snapToGrid }: StageProps) {
  const { document, documentService } = useDocumentService();
  const { clipboardItem, clipboardItems, hasClipboardItem, copyItems } =
    useClipboard();

  // Use the stage state hook
  const [state, actions] = useStageState({ snapToGrid });

  // Extract state values and actions we need
  const { selectedItems, isDragging } = state;

  const {
    handleStageClick,
    handleMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
    handleDeleteItem,
    handleFlipItem,
    isItemSelected,
    getItemVisualPosition,
  } = actions;

  const stageRef = useRef<HTMLDivElement>(null);

  // Clear all items from stage
  const handleClearStage = () => {
    [...document.items].forEach((item) => {
      documentService.removeItem(item.id);
    });
    // Clear selection when stage is cleared
    selectedItems.clear();
  };

  // Add a new item at click position
  const handleAddItem = () => {
    if (!contextMenuState.relativePosition) return;

    const { gridSize } = document.stage;
    const itemSize = 60; // Standard item size
    const halfSize = itemSize / 2;

    // Get click position
    const posX = contextMenuState.relativePosition.x;
    const posY = contextMenuState.relativePosition.y;

    // First subtract half the item size to center it at the click position
    const centerX = posX - halfSize;
    const centerY = posY - halfSize;

    // Then apply grid snapping if enabled
    let finalX = centerX;
    let finalY = centerY;

    if (snapToGrid) {
      finalX = Math.round(centerX / gridSize) * gridSize;
      finalY = Math.round(centerY / gridSize) * gridSize;
    }

    const newItem: StageItemType = {
      id: crypto.randomUUID(),
      name: "New Item",
      category: "equipment",
      icon: "📦",
      position: {
        x: finalX,
        y: finalY,
      },
      width: itemSize,
      height: itemSize,
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
            onClick: () => handlePasteItem(), // Will be defined after contextMenuState
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

  // Paste an item from clipboard - moved after contextMenuState initialization
  const handlePasteItem = useCallback(() => {
    if (!hasClipboardItem() || !contextMenuState.relativePosition) return;

    const { gridSize } = document.stage;

    // Calculate base position for the first item
    const posX = contextMenuState.relativePosition.x;
    const posY = contextMenuState.relativePosition.y;

    if (clipboardItems && clipboardItems.length > 1) {
      // Find center of all items to be pasted
      const itemsCount = clipboardItems.length;

      // Calculate average position to use as a reference point
      let avgX = 0;
      let avgY = 0;
      clipboardItems.forEach((item) => {
        avgX += item.position.x;
        avgY += item.position.y;
      });
      avgX /= itemsCount;
      avgY /= itemsCount;

      // Paste each item with its relative position to the click point
      clipboardItems.forEach((item) => {
        const itemWidth = item.width || 60;
        const itemHeight = item.height || 60;

        // Calculate relative position from average
        const relX = item.position.x - avgX;
        const relY = item.position.y - avgY;

        // Calculate final position, centered at click point
        let finalX = posX + relX;
        let finalY = posY + relY;

        // Apply grid snapping if enabled
        if (snapToGrid) {
          finalX = Math.round(finalX / gridSize) * gridSize;
          finalY = Math.round(finalY / gridSize) * gridSize;
        }

        // Constrain to stage boundaries
        finalX = Math.max(
          0,
          Math.min(document.stage.width - itemWidth, finalX)
        );
        finalY = Math.max(
          0,
          Math.min(document.stage.height - itemHeight, finalY)
        );

        // Create a new item
        const newItem: StageItemType = {
          ...item,
          id: crypto.randomUUID(),
          position: {
            x: finalX,
            y: finalY,
          },
        };

        documentService.addItem(newItem);
      });
    } else if (clipboardItem) {
      // Original single item paste logic
      const itemWidth = clipboardItem.width || 60;
      const itemHeight = clipboardItem.height || 60;

      // First subtract half the item size to center it at the click position
      const centerX = posX - itemWidth / 2;
      const centerY = posY - itemHeight / 2;

      // Then apply grid snapping if enabled
      let finalX = centerX;
      let finalY = centerY;

      if (snapToGrid) {
        finalX = Math.round(centerX / gridSize) * gridSize;
        finalY = Math.round(centerY / gridSize) * gridSize;
      }

      // Create a new item based on the clipboard item but with a new ID
      const newItem: StageItemType = {
        ...clipboardItem,
        id: crypto.randomUUID(),
        position: {
          x: finalX,
          y: finalY,
        },
      };

      documentService.addItem(newItem);
    }
  }, [
    clipboardItem,
    clipboardItems,
    hasClipboardItem,
    document.stage,
    documentService,
    contextMenuState,
    snapToGrid,
  ]);

  // Handle keyboard events - moved below contextMenuState definition
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      console.log(
        "KeyDown event",
        e.key,
        "selected items size:",
        selectedItems.size
      );

      // Delete key - delete selected items
      if (e.key === "Delete" || e.key === "Backspace") {
        console.log("Delete triggered, items:", Array.from(selectedItems));
        selectedItems.forEach((id) => {
          handleDeleteItem(id);
        });
      }

      // Check for keyboard shortcuts with Control/Command
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        // Copy - Ctrl/Cmd+C
        if (e.key === "c" && selectedItems.size > 0) {
          console.log("Copy triggered, items:", Array.from(selectedItems));
          e.preventDefault();
          const itemsToCopy = document.items.filter((item) =>
            selectedItems.has(item.id)
          );
          copyItems(itemsToCopy);
        }

        // Paste - Ctrl/Cmd+V
        if (e.key === "v" && hasClipboardItem()) {
          console.log("Paste triggered");
          e.preventDefault();

          // Get current mouse position or use stage center if not available
          let pastePosition;
          if (stageRef.current) {
            const rect = stageRef.current.getBoundingClientRect();
            pastePosition = {
              x: rect.width / 2,
              y: rect.height / 2,
            };
          }

          // Update context menu state with the position
          if (pastePosition && contextMenuState) {
            // Create a temporary position for paste operation
            contextMenuState.relativePosition = pastePosition;
            handlePasteItem();
          }
        }
      }
    },
    [
      selectedItems,
      handleDeleteItem,
      document.items,
      copyItems,
      hasClipboardItem,
      handlePasteItem,
      contextMenuState,
    ]
  );

  return (
    <>
      <div
        ref={stageRef}
        className={styles.stage}
        data-stage
        data-testid="stage"
        tabIndex={0}
        style={{
          width: `${document.stage.width}px`,
          height: `${document.stage.height}px`,
          backgroundColor: document.stage.backgroundColor,
        }}
        onClick={handleStageClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        {/* Grid lines - only show when showGrid is true */}
        {showGrid && (
          <div
            className={styles.gridContainer}
            style={{
              backgroundSize: `${document.stage.gridSize}px ${document.stage.gridSize}px`,
            }}
          />
        )}

        {/* Stage items */}
        {document.items.map((item) => (
          <StageItem
            key={item.id}
            item={item}
            isDragged={isDragging && isItemSelected(item.id)}
            isSelected={isItemSelected(item.id)}
            dragVisualPosition={getItemVisualPosition(item.id)}
            onMouseDown={handleMouseDown}
            onDelete={handleDeleteItem}
            onFlip={handleFlipItem}
            selectedItemsCount={selectedItems.size}
            getSelectedItems={() =>
              document.items.filter((i) => selectedItems.has(i.id))
            }
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
    </>
  );
}
