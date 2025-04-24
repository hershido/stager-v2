import React, { useState, ReactNode } from "react";
import {
  ContextMenu as ContextMenuComponent,
  MenuItem,
} from "../common/ContextMenu";

interface ContextMenuState {
  show: boolean;
  position: { x: number; y: number };
  relativePosition?: { x: number; y: number };
}

interface UseContextMenuProps {
  items: MenuItem[];
  header?: ReactNode;
  onElementFilter?: (target: HTMLElement) => boolean;
  computeRelativePosition?: (
    e: React.MouseEvent,
    element: HTMLElement
  ) => { x: number; y: number };
}

interface UseContextMenuReturn {
  handleContextMenu: (e: React.MouseEvent) => void;
  ContextMenu: () => React.ReactNode;
  contextMenuState: ContextMenuState;
}

export function useContextMenu({
  items,
  header,
  onElementFilter,
  computeRelativePosition,
}: UseContextMenuProps): UseContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    position: { x: 0, y: 0 },
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    // Optional filtering logic (for example, to ignore clicks on certain elements)
    if (onElementFilter && onElementFilter(e.target as HTMLElement)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const menuState: ContextMenuState = {
      show: true,
      position: { x: e.clientX, y: e.clientY },
    };

    // If we need to compute relative coordinates (e.g., for stage positioning)
    if (computeRelativePosition) {
      menuState.relativePosition = computeRelativePosition(
        e,
        e.currentTarget as HTMLElement
      );
    }

    setContextMenu(menuState);
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  // Wrap all click handlers to ensure menu closes after action
  const wrappedItems = items.map((item) => ({
    ...item,
    onClick: () => {
      item.onClick();
      closeContextMenu();
    },
  }));

  // Render the context menu component
  const ContextMenu = () => {
    if (!contextMenu.show) return null;

    return (
      <ContextMenuComponent
        position={contextMenu.position}
        onClose={closeContextMenu}
        header={header}
        items={wrappedItems}
      />
    );
  };

  return {
    handleContextMenu,
    ContextMenu,
    contextMenuState: contextMenu,
  };
}
