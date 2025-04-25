import { ReactNode, useEffect, useRef } from "react";
import clsx from "clsx";
import styles from "./ContextMenu.module.scss";

export interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export type MenuItemOrDivider = MenuItem | { type: "divider" };

export interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  header?: ReactNode;
  items: MenuItemOrDivider[];
}

function isMenuItem(item: MenuItemOrDivider): item is MenuItem {
  return (item as MenuItem).id !== undefined;
}

export function ContextMenu({
  position,
  onClose,
  header,
  items,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const menuRect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (position.x + menuRect.width > windowWidth) {
      adjustedPosition.x = windowWidth - menuRect.width;
    }

    if (position.y + menuRect.height > windowHeight) {
      adjustedPosition.y = windowHeight - menuRect.height;
    }
  }

  return (
    <div className={styles.contextMenuOverlay}>
      <div
        ref={menuRef}
        className={styles.contextMenu}
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        {header && <div className={styles.contextMenuHeader}>{header}</div>}
        <div className={styles.menuItems}>
          {items.map((item, index) =>
            isMenuItem(item) ? (
              <button
                key={item.id}
                className={clsx(styles.menuItem, {
                  [styles.disabled]: item.disabled,
                })}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    onClose();
                  }
                }}
              >
                {item.label}
              </button>
            ) : (
              <div key={`divider-${index}`} className={styles.divider}></div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
