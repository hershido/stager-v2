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
  const sidePanelRef = useRef<HTMLDivElement>(null);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingSidePanel, setIsDraggingSidePanel] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [sidePanelWidth, setSidePanelWidth] = useState<number>(320); // Remember side panel width

  // Set initial widths from CSS variables when component mounts
  useEffect(() => {
    if (sidebarRef.current) {
      const computedStyle = getComputedStyle(document.documentElement);
      const defaultWidth = parseInt(
        computedStyle.getPropertyValue("--sidebar-width").trim()
      );
      sidebarRef.current.style.width = `${defaultWidth}px`;
    }

    if (sidePanelRef.current) {
      sidePanelRef.current.style.width = `${sidePanelWidth}px`;
    }
  }, [sidePanelWidth]);

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    if (sidebarRef.current) {
      setIsDraggingSidebar(true);
      setStartX(e.clientX);
      setStartWidth(sidebarRef.current.offsetWidth);
      e.preventDefault();
    }
  };

  const handleSidePanelMouseDown = (e: React.MouseEvent) => {
    if (sidePanelRef.current) {
      setIsDraggingSidePanel(true);
      setStartX(e.clientX);
      setStartWidth(sidePanelRef.current.offsetWidth);
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

  const updateSidePanelWidth = useCallback((newWidth: number) => {
    const minWidth = 180;
    const maxWidth = 500;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    setSidePanelWidth(clampedWidth);
    if (sidePanelRef.current) {
      sidePanelRef.current.style.width = `${clampedWidth}px`;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const newWidth = startWidth + e.clientX - startX;
        updateSidebarWidth(newWidth);
      } else if (isDraggingSidePanel && sidePanelRef.current) {
        // For side panel, we're dragging from left edge, so we need to invert the calculation
        const newWidth = startWidth - (e.clientX - startX);
        updateSidePanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingSidePanel(false);
    };

    if (isDraggingSidebar || isDraggingSidePanel) {
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
  }, [
    isDraggingSidebar,
    isDraggingSidePanel,
    startX,
    startWidth,
    updateSidebarWidth,
    updateSidePanelWidth,
  ]);

  return (
    <div className={styles.appLayout}>
      <div className={styles.headerContainer}>{header}</div>
      <div className={styles.workspaceContainer}>
        <div className={styles.sidebarContainer} ref={sidebarRef}>
          {sidebar}
          <div
            className={clsx(styles.resizeHandle, {
              [styles.dragging]: isDraggingSidebar,
            })}
            onMouseDown={handleSidebarMouseDown}
          />
        </div>
        <div className={styles.mainContainer}>{main}</div>
        <div
          className={clsx(styles.sidePanelContainer, {
            [styles.open]: isPanelOpen,
          })}
          ref={sidePanelRef}
          style={{ width: `${sidePanelWidth}px` }}
        >
          <div
            className={clsx(styles.sidePanelResizeHandle, {
              [styles.dragging]: isDraggingSidePanel,
            })}
            onMouseDown={handleSidePanelMouseDown}
          />
          {sidePanel}
        </div>
      </div>
    </div>
  );
}
