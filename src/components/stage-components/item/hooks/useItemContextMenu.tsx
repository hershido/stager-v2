import React, { useState } from "react";
import { MenuItem } from "../../../common/ContextMenu";
import { ContextMenu } from "../../../common/ContextMenu";
import styles from "../StageItem.module.scss";

interface UseItemContextMenuProps {
  itemId: string;
  itemName: string;
  itemIcon: string;
  isFlipped: boolean;
  onFlip: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

interface UseItemContextMenuReturn {
  handleContextMenu: (e: React.MouseEvent) => void;
  ItemContextMenu: () => React.ReactNode;
}

export function useItemContextMenu({
  itemId,
  itemName,
  itemIcon,
  isFlipped,
  onFlip,
  onDelete,
}: UseItemContextMenuProps): UseItemContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
  }>({
    show: false,
    position: { x: 0, y: 0 },
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  // Define menu items for the context menu
  const menuItems: MenuItem[] = [
    {
      id: "flip",
      label: isFlipped ? "Flip Normal" : "Flip Horizontally",
      onClick: () => {
        onFlip(itemId);
        closeContextMenu();
      },
    },
    {
      id: "delete",
      label: "Delete",
      onClick: () => {
        onDelete(itemId);
        closeContextMenu();
      },
    },
  ];

  // Create a header for the context menu
  const menuHeader = (
    <div className={styles.contextMenuHeader}>
      <div className={styles.headerIcon}>{itemIcon}</div>
      <div className={styles.headerName}>{itemName}</div>
    </div>
  );

  // Render the context menu component
  const ItemContextMenu = () => {
    if (!contextMenu.show) return null;

    return (
      <ContextMenu
        position={contextMenu.position}
        onClose={closeContextMenu}
        header={menuHeader}
        items={menuItems}
      />
    );
  };

  return {
    handleContextMenu,
    ItemContextMenu,
  };
}
