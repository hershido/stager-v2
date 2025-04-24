import { useState, useEffect, useRef } from "react";
import { useDocumentService } from "../../../services/documentService";
import { StageItem } from "../../../types/document";
import styles from "./Stage.module.scss";

interface StageProps {
  showGrid: boolean;
  snapToGrid: boolean;
}

export function Stage({ showGrid, snapToGrid }: StageProps) {
  const { document, documentService } = useDocumentService();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stageRect, setStageRect] = useState<DOMRect | null>(null);
  const [dragVisualPosition, setDragVisualPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const hasAddedMockItem = useRef(false);

  // Add a mock item if none exist
  useEffect(() => {
    // Only add mock item if we haven't added one yet and there are no items
    if (document.items.length === 0 && !hasAddedMockItem.current) {
      const mockItem: StageItem = {
        id: crypto.randomUUID(),
        name: "Sample Item",
        category: "equipment",
        icon: "🎸",
        position: {
          x: document.stage.width / 2 - 30,
          y: document.stage.height / 2 - 30,
        },
        width: 100,
        height: 100,
      };

      documentService.addItem(mockItem);
      const mockItem2: StageItem = {
        id: crypto.randomUUID(),
        name: "Sample Item",
        category: "equipment",
        icon: "🎹",
        position: {
          x: document.stage.width / 2 - 30,
          y: document.stage.height / 2 - 30,
        },
        width: 100,
        height: 100,
      };

      documentService.addItem(mockItem2);
      hasAddedMockItem.current = true;
    }
  }, [
    document.items.length,
    document.stage.width,
    document.stage.height,
    documentService,
  ]);

  // Handle stage item dragging
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    const item = document.items.find((item) => item.id === itemId);
    if (!item) return;

    // Calculate offset from the mouse to the item's position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Capture the stage's rect at the start of dragging
    const currentStageRect = (e.currentTarget as HTMLElement)
      .closest(`.${styles.stage}`)
      ?.getBoundingClientRect();
    if (currentStageRect) {
      setStageRect(currentStageRect);
    }

    // Initialize visual position to the item's current position
    setDragVisualPosition(item.position);
    setIsDragging(true);
    setDraggedItem(itemId);

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedItem || !stageRect) return;

    const newX = e.clientX - stageRect.left - offset.x;
    const newY = e.clientY - stageRect.top - offset.y;

    // Only snap to grid if the snapToGrid option is enabled
    if (snapToGrid) {
      const { gridSize } = document.stage;
      const snappedX = Math.round(newX / gridSize) * gridSize;
      const snappedY = Math.round(newY / gridSize) * gridSize;
      setDragVisualPosition({ x: snappedX, y: snappedY });
    } else {
      // Free movement without snapping
      setDragVisualPosition({ x: newX, y: newY });
    }
  };

  const handleOverlayMouseUp = () => {
    if (draggedItem && dragVisualPosition) {
      console.log("Updating document with final position:", dragVisualPosition);
      // Only update the document on mouse up with the final position
      documentService.updateItem(draggedItem, {
        position: dragVisualPosition,
      });
    }

    // Reset drag state
    setIsDragging(false);
    setDraggedItem(null);
    setStageRect(null);
    setDragVisualPosition(null);
  };

  // Render each stage item
  const renderStageItem = (item: StageItem) => {
    // Determine position - use visual position for dragged item
    const position =
      item.id === draggedItem && dragVisualPosition
        ? dragVisualPosition
        : item.position;

    const style = {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: item.width ? `${item.width}px` : "auto",
      height: item.height ? `${item.height}px` : "auto",
      transform: item.isFlipped ? "scaleX(-1)" : undefined,
    };

    return (
      <div
        key={item.id}
        className={styles.stageItem}
        style={style}
        onMouseDown={(e) => handleMouseDown(e, item.id)}
      >
        <div className={styles.itemContent}>
          {/* Simple visual representation - can be enhanced later */}
          <div className={styles.itemIcon}>
            {item.icon ? <span>{item.icon}</span> : "□"}
          </div>
          <div className={styles.itemName}>{item.name}</div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={styles.stage}
      style={{
        width: `${document.stage.width}px`,
        height: `${document.stage.height}px`,
        backgroundColor: document.stage.backgroundColor,
      }}
    >
      {/* Grid lines - only show when showGrid is true */}
      {showGrid && (
        <div className={styles.gridContainer}>{/* Grid implementation */}</div>
      )}

      {/* Stage items */}
      {document.items.map(renderStageItem)}

      {/* Drag overlay - only shown when dragging */}
      {isDragging && (
        <div
          className={styles.dragOverlay}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          onMouseLeave={handleOverlayMouseUp}
        />
      )}
    </div>
  );
}
