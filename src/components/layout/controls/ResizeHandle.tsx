import { MouseEvent } from "react";
import clsx from "clsx";
import styles from "./ResizeHandle.module.scss";

interface ResizeHandleProps {
  position: "left" | "right";
  isDragging: boolean;
  onResizeStart: (e: MouseEvent<HTMLDivElement>) => void;
  title?: string;
}

export function ResizeHandle({
  position,
  isDragging,
  onResizeStart,
  title,
}: ResizeHandleProps) {
  return (
    <div
      className={clsx(styles.resizeHandle, styles[position], {
        [styles.dragging]: isDragging,
      })}
      onMouseDown={onResizeStart}
      title={title}
    />
  );
}
