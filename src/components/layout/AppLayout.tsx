import { ReactNode, useState, useCallback } from "react";
import clsx from "clsx";
import styles from "./AppLayout.module.scss";
import { ResizeHandle } from "./controls/ResizeHandle";

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
          })}
          style={{ width: `${sidePanelWidth}px` }}
        >
          <ResizeHandle
            isDragging={resizing === "sidePanel"}
            onResizeStart={handleSidePanelMouseDown}
            title="Resize panel"
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
