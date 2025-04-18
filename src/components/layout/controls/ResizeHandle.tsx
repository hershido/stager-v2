import { MouseEvent } from "react";
import clsx from "clsx";
import styles from "./ResizeHandle.module.scss";

interface ResizeHandleProps {
  isDragging: boolean;
  onResizeStart: (e: MouseEvent<HTMLDivElement>) => void;
  title?: string;
}

export function ResizeHandle({
  isDragging,
  onResizeStart,
  title,
}: ResizeHandleProps) {
  return (
    <div
      className={clsx(styles.resizeHandle, {
        [styles.dragging]: isDragging,
      })}
      onMouseDown={onResizeStart}
      title={title}
    />
  );
}
