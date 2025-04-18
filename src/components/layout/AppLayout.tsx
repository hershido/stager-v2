import { ReactNode, useState, useCallback } from "react";
import clsx from "clsx";
import styles from "./AppLayout.module.scss";
import { ResizeHandle } from "./controls/ResizeHandle";
import { PanelToggle } from "./controls/PanelToggle";

interface AppLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  sidePanel: ReactNode;
}

export function AppLayout({
  header,
  sidebar,
  main,
  sidePanel,
}: AppLayoutProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [sidePanelWidth, setSidePanelWidth] = useState(320);

  const [resizing, setResizing] = useState<null | "sidebar" | "sidePanel">(
    null
  );
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    setResizing("sidebar");
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
    e.preventDefault();
  };

  const handleSidePanelMouseDown = (e: React.MouseEvent) => {
    setResizing("sidePanel");
    setStartX(e.clientX);
    setStartWidth(sidePanelWidth);
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!resizing) return;

      if (resizing === "sidebar") {
        const newWidth = startWidth + e.clientX - startX;
        const minWidth = 180;
        const maxWidth = 500;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        setSidebarWidth(clampedWidth);
      } else if (resizing === "sidePanel") {
        const newWidth = startWidth - (e.clientX - startX);
        const minWidth = 180;
        const maxWidth = 500;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        setSidePanelWidth(clampedWidth);
      }
    },
    [resizing, startX, startWidth]
  );

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  const togglePanel = useCallback(() => {
    // Set transitioning state to help manage hover effects
    setIsTransitioning(true);
    setIsPanelOpen((prev) => !prev);

    // Clear transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 350); // slightly longer than the transition duration
  }, []);

  return (
    <div className={styles.appLayout}>
      <div className={styles.headerContainer}>{header}</div>
      <div className={styles.workspaceContainer}>
        <div
          className={styles.sidebarContainer}
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className={styles.sidebarContent}>{sidebar}</div>
          <ResizeHandle
            isDragging={resizing === "sidebar"}
            onResizeStart={handleSidebarMouseDown}
            title="Resize sidebar"
          />
        </div>
        <div className={styles.mainContainer}>{main}</div>
        <div
          className={clsx(styles.sidePanelContainer, {
            [styles.open]: isPanelOpen,
            [styles.transitioning]: isTransitioning,
          })}
          style={{ width: `${sidePanelWidth}px` }}
        >
          <ResizeHandle
            isDragging={resizing === "sidePanel"}
            onResizeStart={handleSidePanelMouseDown}
            title="Resize panel"
          />
          <PanelToggle
            onToggle={togglePanel}
            title={isPanelOpen ? "Close panel" : "Open panel"}
          />
          <div className={styles.sidePanelContent}>{sidePanel}</div>
        </div>
      </div>

      {resizing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: "col-resize",
            zIndex: 9999,
            userSelect: "none",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
    </div>
  );
}
