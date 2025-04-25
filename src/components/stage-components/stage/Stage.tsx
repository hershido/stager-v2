import { useDocumentService } from "../../../services/documentService";
import { StageItem as StageItemType } from "../../../types/document";
import { StageItem } from "../item/StageItem";
import { useContextMenu } from "../../hooks/useContextMenu";
import { MenuItemOrDivider } from "../../common/ContextMenu";
import { useClipboard } from "../../../context/ClipboardContext";
import { useStageState } from "./hooks/useStageState";
import styles from "./Stage.module.scss";

interface StageProps {
  showGrid: boolean;
  snapToGrid: boolean;
}

export function Stage({ showGrid, snapToGrid }: StageProps) {
  const { document, documentService } = useDocumentService();
  const { clipboardItem, hasClipboardItem } = useClipboard();

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

  // Paste an item from clipboard
  const handlePasteItem = () => {
    if (!clipboardItem || !contextMenuState.relativePosition) return;

    const { gridSize } = document.stage;
    const itemWidth = clipboardItem.width || 60;
    const itemHeight = clipboardItem.height || 60;

    // Get click position
    const posX = contextMenuState.relativePosition.x;
    const posY = contextMenuState.relativePosition.y;

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

  return (
    <div
      className={styles.stage}
      style={{
        width: `${document.stage.width}px`,
        height: `${document.stage.height}px`,
        backgroundColor: document.stage.backgroundColor,
      }}
      data-stage
      onContextMenu={handleContextMenu}
      onClick={handleStageClick}
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
