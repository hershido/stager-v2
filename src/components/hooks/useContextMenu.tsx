import React, { useState, ReactNode } from "react";
import {
  ContextMenu as ContextMenuComponent,
  MenuItemOrDivider,
} from "../common/ContextMenu";

interface ContextMenuState {
  show: boolean;
  position: { x: number; y: number };
  relativePosition?: { x: number; y: number };
}

interface UseContextMenuProps {
  items: MenuItemOrDivider[];
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

  // No need to wrap click handlers since the ContextMenu component handles closing

  // Render the context menu component
  const ContextMenu = () => {
    if (!contextMenu.show) return null;

    return (
      <ContextMenuComponent
        position={contextMenu.position}
        onClose={closeContextMenu}
        header={header}
        items={items}
      />
    );
  };

  return {
    handleContextMenu,
    ContextMenu,
    contextMenuState: contextMenu,
  };
}
