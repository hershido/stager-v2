import { MouseEvent, useState } from "react";
import styles from "./PanelToggle.module.scss";
import clsx from "clsx";
import openIcon from "../../../assets/layout/openSidePanelIcon.svg";
import closeIcon from "../../../assets/layout/closeSidePanelIcon.svg";

interface PanelToggleProps {
  onToggle: () => void;
  title?: string;
  isOpen: boolean;
}

export function PanelToggle({
  onToggle,
  title = "Toggle panel",
  isOpen,
}: PanelToggleProps) {
  const [isForceReset, setIsForceReset] = useState(false);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent event bubbling

    // Force reset of hover state
    setIsForceReset(true);
    setTimeout(() => setIsForceReset(false), 100);

    onToggle();
  };

  return (
    <div
      className={clsx(styles.panelToggle, {
        [styles.forceReset]: isForceReset,
      })}
      onClick={handleClick}
      title={title}
    >
      <img
        src={isOpen ? closeIcon : openIcon}
        alt={isOpen ? "Close panel" : "Open panel"}
        className={styles.icon}
      />
    </div>
  );
}
