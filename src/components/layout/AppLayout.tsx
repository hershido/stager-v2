import { ReactNode, useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import styles from "./AppLayout.module.scss";

interface AppLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  sidePanel: ReactNode;
  isPanelOpen: boolean;
}

export function AppLayout({
  header,
  sidebar,
  main,
  sidePanel,
  isPanelOpen,
}: AppLayoutProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Set initial width from CSS variable when component mounts
  useEffect(() => {
    if (sidebarRef.current) {
      const computedStyle = getComputedStyle(document.documentElement);
      const defaultWidth = parseInt(
        computedStyle.getPropertyValue("--sidebar-width").trim()
      );
      sidebarRef.current.style.width = `${defaultWidth}px`;
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (sidebarRef.current) {
      setIsDragging(true);
      setStartX(e.clientX);
      setStartWidth(sidebarRef.current.offsetWidth);
      e.preventDefault();
    }
  };

  const updateSidebarWidth = useCallback((newWidth: number) => {
    const minWidth = 180;
    const maxWidth = 500;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${clampedWidth}px`;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = startWidth + e.clientX - startX;
      updateSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Prevent text selection during drag
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, startX, startWidth, updateSidebarWidth]);

  return (
    <div className={styles.appLayout}>
      <div className={styles.headerContainer}>{header}</div>
      <div className={styles.workspaceContainer}>
        <div className={styles.sidebarContainer} ref={sidebarRef}>
          {sidebar}
          <div
            className={clsx(styles.resizeHandle, {
              [styles.dragging]: isDragging,
            })}
            onMouseDown={handleMouseDown}
          />
        </div>
        <div className={styles.mainContainer}>{main}</div>
        <div
          className={clsx(styles.sidePanelContainer, {
            [styles.open]: isPanelOpen,
          })}
        >
          {sidePanel}
        </div>
      </div>
    </div>
  );
}
