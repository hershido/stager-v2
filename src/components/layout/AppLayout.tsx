import { ReactNode } from "react";
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
  return (
    <div className={styles.appLayout}>
      <div className={styles.headerContainer}>{header}</div>
      <div className={styles.workspaceContainer}>
        <div className={styles.sidebarContainer}>{sidebar}</div>
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
