import { MouseEvent, useState } from "react";
import styles from "./PanelToggle.module.scss";
import clsx from "clsx";

interface PanelToggleProps {
  onToggle: () => void;
  title?: string;
}

export function PanelToggle({
  onToggle,
  title = "Toggle panel",
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
    />
  );
}
