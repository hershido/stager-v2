import { useEffect, useRef, ReactNode } from "react";
import styles from "./ContextMenu.module.scss";

export interface MenuItem {
  id: string;
  label: string | ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  header?: ReactNode;
  items: MenuItem[];
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

  const style = {
    top: `${position.y}px`,
    left: `${position.x}px`,
  };

  return (
    <div className={styles.contextMenuOverlay}>
      <div ref={menuRef} className={styles.contextMenu} style={style}>
        {header && <div className={styles.contextMenuHeader}>{header}</div>}
        <div className={styles.menuItems}>
          {items.map((item) => (
            <button
              key={item.id}
              className={styles.menuItem}
              onClick={() => {
                item.onClick();
                onClose(); // Close menu after clicking an item
              }}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
