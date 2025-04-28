import { useDocumentService } from "../../../services/documentService";
import { StageItem as StageItemType } from "../../../types/document";
import { StageItem } from "../item/StageItem";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboardService } from "../../../services/clipboardService";
import { useStageState } from "./hooks/useStageState";
import { useShortcut } from "../../../contexts/KeyboardContext";
import styles from "./Stage.module.scss";
import React, { useRef, useCallback, useState } from "react";

// Icon component for keyboard shortcuts
const ShortcutIcon = ({ children }: { children: React.ReactNode }) => (
  <span className={styles.shortcutIcon}>{children}</span>
);

interface StageProps {
  showGrid: boolean;
  snapToGrid: boolean;
}

export function Stage({ showGrid, snapToGrid }: StageProps) {
  console.log(`Stage render: ${new Date().toISOString()}`);

  const { document, documentService } = useDocumentService();
  const { clipboardService, clipboardItem, clipboardItems } =
    useClipboardService();
  const { hasClipboardItem, copyItems, cutItems } = clipboardService;

  // Use the stage state hook
  const [state, actions] = useStageState({ snapToGrid });

  // Extract state values and actions we need
  const {
    selectedItems,
    isDragging,
    isLassoActive,
    lassoRect,
    alignmentGuides,
    isDuplicating,
  } = state;

  const {
    handleStageClick,
    handleMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
    handleDeleteItem,
    handleFlipItem,
    isItemSelected,
    getItemVisualPosition,
    selectAllItems,
    handleLassoStart,
    handleLassoMove,
    handleLassoEnd,
  } = actions;

  const stageRef = useRef<HTMLDivElement>(null);

  // Track current mouse position within the stage
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle mouse move to track cursor position
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

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
            shortcut: (
              <>
                <ShortcutIcon>⌘</ShortcutIcon>V
              </>
            ),
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

  // Paste an item from clipboard
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

  // Register keyboard shortcuts using our new hook system

  // Delete key - delete selected items
  useShortcut(
    "delete",
    (e) => {
      console.log("Delete triggered, items:", Array.from(selectedItems));
      e.preventDefault();
      selectedItems.forEach((id) => {
        handleDeleteItem(id);
      });
    },
    [selectedItems, handleDeleteItem]
  );

  // Also handle Backspace for delete
  useShortcut(
    "backspace",
    (e) => {
      console.log(
        "Backspace delete triggered, items:",
        Array.from(selectedItems)
      );
      e.preventDefault();
      selectedItems.forEach((id) => {
        handleDeleteItem(id);
      });
    },
    [selectedItems, handleDeleteItem]
  );

  // Select All - Ctrl+A
  useShortcut(
    "ctrl+a",
    (e) => {
      console.log("Select All triggered");
      e.preventDefault();
      selectAllItems();
    },
    [selectAllItems]
  );

  // Copy - Ctrl+C
  useShortcut(
    "ctrl+c",
    (e) => {
      console.log("Copy shortcut triggered");
      if (selectedItems.size === 0) return;

      console.log("Copy executing for items:", Array.from(selectedItems));
      e.preventDefault();
      const itemsToCopy = document.items.filter((item) =>
        selectedItems.has(item.id)
      );
      copyItems(itemsToCopy);
    },
    [selectedItems, document.items, copyItems]
  );

  // Cut - Ctrl+X
  useShortcut(
    "ctrl+x",
    (e) => {
      console.log("Cut shortcut triggered");
      if (selectedItems.size === 0) return;

      console.log("Cut executing for items:", Array.from(selectedItems));
      e.preventDefault();
      const itemsToCut = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      // Use the cutItems function from the ClipboardContext
      cutItems(itemsToCut, handleDeleteItem);
    },
    [selectedItems, document.items, cutItems, handleDeleteItem]
  );

  // Paste - Ctrl+V
  useShortcut(
    "ctrl+v",
    (e) => {
      console.log("Paste shortcut triggered");
      if (!hasClipboardItem()) return;

      console.log("Paste executing");
      e.preventDefault();

      // Use current mouse position for pasting
      if (contextMenuState) {
        // Check if mouse position is within stage bounds
        const isInBounds =
          mousePosition.x >= 0 &&
          mousePosition.x <= document.stage.width &&
          mousePosition.y >= 0 &&
          mousePosition.y <= document.stage.height;

        if (isInBounds) {
          // Use the current mouse position if in bounds
          contextMenuState.relativePosition = { ...mousePosition };
        } else {
          // Use center of stage if cursor is outside bounds
          contextMenuState.relativePosition = {
            x: document.stage.width / 2,
            y: document.stage.height / 2,
          };
        }

        handlePasteItem();
      }
    },
    [
      hasClipboardItem,
      handlePasteItem,
      contextMenuState,
      mousePosition,
      document.stage,
    ]
  );

  // Duplicate - Ctrl+D
  useShortcut(
    "ctrl+d",
    (e) => {
      console.log("Duplicate shortcut triggered");
      if (selectedItems.size === 0) return;

      console.log("Duplicate executing for items:", Array.from(selectedItems));
      e.preventDefault();

      const itemsToDuplicate = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      // Create duplicates with offset position
      itemsToDuplicate.forEach((item) => {
        const newItem: StageItemType = {
          ...item,
          id: crypto.randomUUID(),
          position: {
            x: item.position.x + 20,
            y: item.position.y + 20,
          },
        };
        documentService.addItem(newItem);
      });
    },
    [selectedItems, document.items, documentService]
  );

  // Alignment and Distribution Shortcuts
  // Add debug message to show when these shortcuts are registered
  console.log("Registering alignment shortcuts in Stage component");

  // Align Left - Option + A
  useShortcut(
    "alt+a",
    (e) => {
      console.log("Align Left shortcut triggered");
      if (selectedItems.size === 0) return;

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      if (selectedItems.size === 1) {
        // Single item - align to left edge of stage
        const item = selectedItemsList[0];
        documentService.updateItem(item.id, {
          position: {
            ...item.position,
            x: 0,
          },
        });
      } else {
        // Multi-select - align to leftmost item
        const leftmost = Math.min(
          ...selectedItemsList.map((item) => item.position.x)
        );

        selectedItemsList.forEach((item) => {
          documentService.updateItem(item.id, {
            position: {
              ...item.position,
              x: leftmost,
            },
          });
        });
      }
    },
    [selectedItems, document.items, documentService],
    { priority: 20 } // Set high priority for alignment shortcuts
  );

  // Align Center - Option + H
  useShortcut(
    "alt+h",
    (e) => {
      console.log("Align Center shortcut triggered");
      if (selectedItems.size === 0) return;

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      if (selectedItems.size === 1) {
        // Single item - center on stage
        const item = selectedItemsList[0];
        const stageWidth = document.stage.width;
        const itemWidth = item.width || 0;

        documentService.updateItem(item.id, {
          position: {
            ...item.position,
            x: (stageWidth - itemWidth) / 2,
          },
        });
      } else {
        // Multi-select - align to center of selection
        const getBoundsOfItems = (items: StageItemType[]) => {
          const left = Math.min(...items.map((i) => i.position.x));
          const right = Math.max(
            ...items.map((i) => i.position.x + (i.width || 0))
          );
          const width = right - left;
          return { left, width };
        };

        const bounds = getBoundsOfItems(selectedItemsList);
        const centerX = bounds.left + bounds.width / 2;

        selectedItemsList.forEach((item) => {
          const itemCenterOffset = (item.width || 0) / 2;
          documentService.updateItem(item.id, {
            position: {
              ...item.position,
              x: centerX - itemCenterOffset,
            },
          });
        });
      }
    },
    [selectedItems, document.items, documentService, document.stage.width]
  );

  // Align Right - Option + D
  useShortcut(
    "alt+d",
    (e) => {
      console.log("Align Right shortcut triggered");
      if (selectedItems.size === 0) return;

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      if (selectedItems.size === 1) {
        // Single item - align to right edge of stage
        const item = selectedItemsList[0];
        const stageWidth = document.stage.width;
        const itemWidth = item.width || 0;

        documentService.updateItem(item.id, {
          position: {
            ...item.position,
            x: stageWidth - itemWidth,
          },
        });
      } else {
        // Multi-select - align to rightmost item
        const rightEdges = selectedItemsList.map(
          (item) => item.position.x + (item.width || 0)
        );
        const rightmost = Math.max(...rightEdges);

        selectedItemsList.forEach((item) => {
          documentService.updateItem(item.id, {
            position: {
              ...item.position,
              x: rightmost - (item.width || 0),
            },
          });
        });
      }
    },
    [selectedItems, document.items, documentService, document.stage.width]
  );

  // Align Top - Option + W
  useShortcut(
    "alt+w",
    (e) => {
      console.log("Align Top shortcut triggered");
      if (selectedItems.size === 0) return;

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      if (selectedItems.size === 1) {
        // Single item - align to top edge of stage
        const item = selectedItemsList[0];
        documentService.updateItem(item.id, {
          position: {
            ...item.position,
            y: 0,
          },
        });
      } else {
        // Multi-select - align to topmost item
        const topmost = Math.min(
          ...selectedItemsList.map((item) => item.position.y)
        );

        selectedItemsList.forEach((item) => {
          documentService.updateItem(item.id, {
            position: {
              ...item.position,
              y: topmost,
            },
          });
        });
      }
    },
    [selectedItems, document.items, documentService]
  );

  // Align Vertical Centers - Option + V
  useShortcut(
    "alt+v",
    (e) => {
      console.log("Align Vertical Centers shortcut triggered");
      if (selectedItems.size === 0) return;

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      if (selectedItems.size === 1) {
        // Single item - center vertically on stage
        const item = selectedItemsList[0];
        const stageHeight = document.stage.height;
        const itemHeight = item.height || 0;

        documentService.updateItem(item.id, {
          position: {
            ...item.position,
            y: (stageHeight - itemHeight) / 2,
          },
        });
      } else {
        // Multi-select - align to vertical center of selection
        const getBoundsOfItems = (items: StageItemType[]) => {
          const top = Math.min(...items.map((i) => i.position.y));
          const bottom = Math.max(
            ...items.map((i) => i.position.y + (i.height || 0))
          );
          const height = bottom - top;
          return { top, height };
        };

        const bounds = getBoundsOfItems(selectedItemsList);
        const centerY = bounds.top + bounds.height / 2;

        selectedItemsList.forEach((item) => {
          const itemCenterOffset = (item.height || 0) / 2;
          documentService.updateItem(item.id, {
            position: {
              ...item.position,
              y: centerY - itemCenterOffset,
            },
          });
        });
      }
    },
    [selectedItems, document.items, documentService, document.stage.height]
  );

  // Align Bottom - Option + S
  useShortcut(
    "alt+s",
    (e) => {
      console.log("Align Bottom shortcut triggered");
      if (selectedItems.size === 0) return;

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      if (selectedItems.size === 1) {
        // Single item - align to bottom edge of stage
        const item = selectedItemsList[0];
        const stageHeight = document.stage.height;
        const itemHeight = item.height || 0;

        documentService.updateItem(item.id, {
          position: {
            ...item.position,
            y: stageHeight - itemHeight,
          },
        });
      } else {
        // Multi-select - align to bottommost item
        const bottomEdges = selectedItemsList.map(
          (item) => item.position.y + (item.height || 0)
        );
        const bottommost = Math.max(...bottomEdges);

        selectedItemsList.forEach((item) => {
          documentService.updateItem(item.id, {
            position: {
              ...item.position,
              y: bottommost - (item.height || 0),
            },
          });
        });
      }
    },
    [selectedItems, document.items, documentService, document.stage.height]
  );

  // Distribute Horizontal Spacing - Ctrl + Option + H
  useShortcut(
    "ctrl+alt+h",
    (e) => {
      console.log("Distribute Horizontal Spacing shortcut triggered");
      if (selectedItems.size < 3) return; // Need at least 3 items to distribute

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      // Sort items by their x position
      const sortedItems = [...selectedItemsList].sort(
        (a, b) => a.position.x - b.position.x
      );

      // Calculate total available space
      const leftmostItem = sortedItems[0];
      const rightmostItem = sortedItems[sortedItems.length - 1];
      const leftEdge = leftmostItem.position.x + (leftmostItem.width || 0);
      const rightEdge = rightmostItem.position.x;

      const totalSpace = rightEdge - leftEdge;
      const itemCount = sortedItems.length - 2; // Exclude first and last items
      const spacing = totalSpace / (itemCount + 1);

      // Skip first and last items as they stay in place
      for (let i = 1; i < sortedItems.length - 1; i++) {
        const currentItem = sortedItems[i];
        documentService.updateItem(currentItem.id, {
          position: {
            ...currentItem.position,
            x: leftEdge + spacing * i - (currentItem.width || 0) / 2,
          },
        });
      }
    },
    [selectedItems, document.items, documentService]
  );

  // Distribute Vertical Spacing - Ctrl + Option + V
  useShortcut(
    "ctrl+alt+v",
    (e) => {
      console.log("Distribute Vertical Spacing shortcut triggered");
      if (selectedItems.size < 3) return; // Need at least 3 items to distribute

      e.preventDefault();

      const selectedItemsList = document.items.filter((item) =>
        selectedItems.has(item.id)
      );

      // Sort items by their y position
      const sortedItems = [...selectedItemsList].sort(
        (a, b) => a.position.y - b.position.y
      );

      // Calculate total available space
      const topmostItem = sortedItems[0];
      const bottommostItem = sortedItems[sortedItems.length - 1];
      const topEdge = topmostItem.position.y + (topmostItem.height || 0);
      const bottomEdge = bottommostItem.position.y;

      const totalSpace = bottomEdge - topEdge;
      const itemCount = sortedItems.length - 2; // Exclude first and last items
      const spacing = totalSpace / (itemCount + 1);

      // Skip first and last items as they stay in place
      for (let i = 1; i < sortedItems.length - 1; i++) {
        const currentItem = sortedItems[i];
        documentService.updateItem(currentItem.id, {
          position: {
            ...currentItem.position,
            y: topEdge + spacing * i - (currentItem.height || 0) / 2,
          },
        });
      }
    },
    [selectedItems, document.items, documentService]
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
        onMouseMove={handleMouseMove}
        onMouseDown={handleLassoStart}
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
            isDuplicating={isDuplicating && isItemSelected(item.id)}
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

        {/* Show ghost duplicates during duplication */}
        {isDragging && isDuplicating && (
          <>
            {Array.from(selectedItems).map((itemId) => {
              const item = document.items.find((i) => i.id === itemId);
              const position = state.selectedItemsPositions[itemId];
              if (item && position) {
                return (
                  <StageItem
                    key={`duplicate-${itemId}`}
                    item={{
                      ...item,
                      id: `duplicate-${itemId}`,
                    }}
                    isDragged={true}
                    isSelected={true}
                    isDuplicating={true}
                    dragVisualPosition={position}
                    onMouseDown={() => {}} // No-op for ghost items
                    onDelete={() => {}} // No-op for ghost items
                    onFlip={() => {}} // No-op for ghost items
                    selectedItemsCount={selectedItems.size}
                    getSelectedItems={() => []}
                  />
                );
              }
              return null;
            })}
          </>
        )}

        {/* Alignment guides - only shown during dragging */}
        {isDragging &&
          alignmentGuides?.map((guide, index) => (
            <div
              key={`guide-${index}`}
              className={styles.alignmentGuide}
              style={{
                [guide.orientation === "horizontal"
                  ? "top"
                  : "left"]: `${guide.position}px`,
                [guide.orientation === "horizontal" ? "width" : "height"]:
                  "100%",
                [guide.orientation === "horizontal" ? "height" : "width"]:
                  "1px",
                [guide.orientation === "horizontal" ? "left" : "top"]:
                  guide.start !== undefined ? `${guide.start}px` : "0",
                [guide.orientation === "horizontal" ? "width" : "height"]:
                  guide.start !== undefined && guide.end !== undefined
                    ? `${guide.end - guide.start}px`
                    : "100%",
              }}
            />
          ))}

        {/* Lasso selection rectangle */}
        {isLassoActive && lassoRect && (
          <div
            className={styles.lassoSelection}
            style={{
              left: `${lassoRect.x}px`,
              top: `${lassoRect.y}px`,
              width: `${lassoRect.width}px`,
              height: `${lassoRect.height}px`,
            }}
          />
        )}

        {/* Drag overlay - only shown when dragging */}
        {isDragging && (
          <div
            className={styles.dragOverlay}
            onMouseMove={handleOverlayMouseMove}
            onMouseUp={handleOverlayMouseUp}
            onMouseLeave={handleOverlayMouseUp}
          />
        )}

        {/* Lasso overlay - only shown when lasso is active */}
        {isLassoActive && (
          <div
            className={styles.lassoOverlay}
            onMouseMove={handleLassoMove}
            onMouseUp={handleLassoEnd}
            onMouseLeave={handleLassoEnd}
          />
        )}

        {/* Stage context menu */}
        <StageContextMenu />
      </div>
    </>
  );
}
