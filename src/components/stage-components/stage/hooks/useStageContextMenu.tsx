import React, { useState, ReactNode } from "react";
import { StageItem } from "../../../../types/document";
import { ContextMenu, MenuItem } from "../../../common/ContextMenu";

interface UseStageContextMenuProps {
  snapToGrid: boolean;
  gridSize: number;
  itemsCount: number;
  addItem: (item: StageItem) => void;
  clearStage: () => void;
  headerComponent?: ReactNode;
}

interface UseStageContextMenuReturn {
  handleContextMenu: (e: React.MouseEvent, stageItemClass: string) => void;
  StageContextMenu: () => React.ReactNode;
}

export function useStageContextMenu({
  snapToGrid,
  gridSize,
  itemsCount,
  addItem,
  clearStage,
  headerComponent,
}: UseStageContextMenuProps): UseStageContextMenuReturn {
  // State for the stage context menu
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    stagePosition: { x: number; y: number };
  }>({
    show: false,
    position: { x: 0, y: 0 },
    stagePosition: { x: 0, y: 0 },
  });

  // Handle background context menu
  const handleContextMenu = (e: React.MouseEvent, stageItemClass: string) => {
    // Only show context menu when clicking on stage background, not on items
    if ((e.target as HTMLElement).closest(`.${stageItemClass}`)) return;

    e.preventDefault();

    // Get the stage element and its rect
    const stageElement = e.currentTarget as HTMLElement;
    const stageRect = stageElement.getBoundingClientRect();

    // Calculate stage-relative coordinates
    const stagePosition = {
      x: e.clientX - stageRect.left,
      y: e.clientY - stageRect.top,
    };

    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      stagePosition,
    });
  };

  // Add a new item at click position
  const handleAddItem = () => {
    const { stagePosition } = contextMenu;

    // Apply grid snapping if enabled
    let posX = stagePosition.x;
    let posY = stagePosition.y;

    if (snapToGrid) {
      posX = Math.round(posX / gridSize) * gridSize;
      posY = Math.round(posY / gridSize) * gridSize;
    }

    const newItem: StageItem = {
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

    addItem(newItem);
    closeContextMenu();
  };

  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  // Define menu items for the stage context menu
  const menuItems: MenuItem[] = [
    {
      id: "add-item",
      label: "Add Item Here",
      onClick: handleAddItem,
    },
    {
      id: "clear",
      label: "Clear Stage",
      onClick: () => {
        clearStage();
        closeContextMenu();
      },
      disabled: itemsCount === 0,
    },
  ];

  // Render the context menu component
  const StageContextMenu = () => {
    if (!contextMenu.show) return null;

    return (
      <ContextMenu
        position={contextMenu.position}
        onClose={closeContextMenu}
        header={headerComponent}
        items={menuItems}
      />
    );
  };

  return {
    handleContextMenu,
    StageContextMenu,
  };
}
