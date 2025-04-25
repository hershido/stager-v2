import { useState, useCallback } from "react";
import { useDocumentService } from "../../../../services/documentService";

// Types
interface Position {
  x: number;
  y: number;
}

interface DraggedItemsInitialState {
  [itemId: string]: Position;
}

interface SelectedItemsPositions {
  [itemId: string]: Position | null;
}

export interface StageStateProps {
  snapToGrid: boolean;
}

export interface StageState {
  // Selection state
  selectedItems: Set<string>;

  // Dragging state
  isDragging: boolean;
  draggedItem: string | null;
  offset: Position;
  stageRect: DOMRect | null;
  initialItemPositions: DraggedItemsInitialState;
  selectedItemsPositions: SelectedItemsPositions;
}

export interface StageStateActions {
  // Selection actions
  handleStageClick: (e: React.MouseEvent) => void;
  handleItemSelect: (e: React.MouseEvent, itemId: string) => void;

  // Dragging actions
  handleMouseDown: (e: React.MouseEvent, itemId: string) => void;
  handleOverlayMouseMove: (e: React.MouseEvent) => void;
  handleOverlayMouseUp: () => void;

  // Item actions
  handleDeleteItem: (itemId: string) => void;
  handleFlipItem: (itemId: string) => void;

  // Helpers
  isItemSelected: (itemId: string) => boolean;
  getItemVisualPosition: (itemId: string) => Position | null;
}

export function useStageState({
  snapToGrid,
}: StageStateProps): [StageState, StageStateActions] {
  const { document, documentService } = useDocumentService();

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [stageRect, setStageRect] = useState<DOMRect | null>(null);

  // Track initial positions of all selected items when drag starts
  const [initialItemPositions, setInitialItemPositions] =
    useState<DraggedItemsInitialState>({});

  // Track all items' current visual positions during drag
  const [selectedItemsPositions, setSelectedItemsPositions] =
    useState<SelectedItemsPositions>({});

  // Clear selection when clicking on stage background
  const handleStageClick = useCallback((e: React.MouseEvent) => {
    // Only clear if clicking directly on stage (not on an item)
    if (e.target === e.currentTarget) {
      setSelectedItems(new Set());
    }
  }, []);

  // Handle item selection
  const handleItemSelect = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation(); // Prevent stage click handler from firing

      // Get current selection
      const newSelectedItems = new Set(selectedItems);

      // Multi-select with Shift key
      if (e.shiftKey) {
        if (newSelectedItems.has(itemId)) {
          newSelectedItems.delete(itemId);
        } else {
          newSelectedItems.add(itemId);
        }
      } else {
        // Single select (replace current selection)
        newSelectedItems.clear();
        newSelectedItems.add(itemId);
      }

      setSelectedItems(newSelectedItems);
    },
    [selectedItems]
  );

  // Handle stage item dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      // Skip if right-button
      if (e.button === 2) return;

      const item = document.items.find((item) => item.id === itemId);
      if (!item) return;

      // If shift key is pressed, handle selection instead of dragging
      if (e.shiftKey) {
        handleItemSelect(e, itemId);
        return;
      }

      // If item isn't already selected, select just this item
      // This preserves multi-selection when starting to drag a selected item
      if (!selectedItems.has(itemId)) {
        handleItemSelect(e, itemId);
      }

      // Calculate offset from the mouse to the item's position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      // Capture the stage's rect at the start of dragging
      const currentStageRect = (e.currentTarget as HTMLElement)
        .closest(`[data-stage]`)
        ?.getBoundingClientRect();
      if (currentStageRect) {
        setStageRect(currentStageRect);
      }

      // Save initial positions of all selected items
      const initialPositions: DraggedItemsInitialState = {};
      const positions: SelectedItemsPositions = {};

      // If dragging a selected item, save positions of all selected items
      if (selectedItems.has(itemId)) {
        document.items.forEach((item) => {
          if (selectedItems.has(item.id)) {
            initialPositions[item.id] = { ...item.position };
            positions[item.id] = { ...item.position };
          }
        });
      } else {
        // If dragging a non-selected item, just save its position
        initialPositions[itemId] = { ...item.position };
        positions[itemId] = { ...item.position };
      }

      setInitialItemPositions(initialPositions);
      setSelectedItemsPositions(positions);

      // Set dragging state
      setDraggedItem(itemId);
      setIsDragging(true);

      // Prevent text selection during drag
      e.preventDefault();
    },
    [document.items, handleItemSelect, selectedItems]
  );

  const handleOverlayMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !draggedItem || !stageRect) return;

      // Find the current item to get its dimensions
      const item = document.items.find((item) => item.id === draggedItem);
      if (!item) return;

      const itemWidth = item.width;
      const itemHeight = item.height;

      const newX = e.clientX - stageRect.left - offset.x;
      const newY = e.clientY - stageRect.top - offset.y;

      // Calculate constrained position for the dragged item
      let constrainedX = Math.max(
        0,
        Math.min(document.stage.width - itemWidth, newX)
      );
      let constrainedY = Math.max(
        0,
        Math.min(document.stage.height - itemHeight, newY)
      );

      // Only snap to grid if the snapToGrid option is enabled
      if (snapToGrid) {
        const { gridSize } = document.stage;
        const snappedX = Math.round(constrainedX / gridSize) * gridSize;
        const snappedY = Math.round(constrainedY / gridSize) * gridSize;

        // Make sure snapping doesn't push outside boundaries
        // For exact boundary alignment, use precise calculation
        constrainedX = Math.min(document.stage.width - itemWidth, snappedX);
        constrainedY = Math.min(document.stage.height - itemHeight, snappedY);

        // Allow snapping exactly to edges when very close
        if (snappedX < gridSize && snappedX > 0) constrainedX = 0;
        if (snappedY < gridSize && snappedY > 0) constrainedY = 0;

        const rightEdge = document.stage.width - itemWidth;
        const bottomEdge = document.stage.height - itemHeight;

        if (Math.abs(snappedX - rightEdge) < gridSize && snappedX < rightEdge)
          constrainedX = rightEdge;
        if (Math.abs(snappedY - bottomEdge) < gridSize && snappedY < bottomEdge)
          constrainedY = bottomEdge;
      }

      // Calculate movement delta from initial position
      const initialPos = initialItemPositions[draggedItem];
      if (!initialPos) return;

      // Calculate the delta that would be applied to the currently dragged item
      let maxDeltaX = constrainedX - initialPos.x;
      let maxDeltaY = constrainedY - initialPos.y;

      // Check constraints for all selected items to find most restrictive constraints
      if (selectedItems.size > 1) {
        // Remove the directional constraint checks that were causing bugs
        Object.keys(initialItemPositions).forEach((id) => {
          if (selectedItems.has(id)) {
            const initialItemPos = initialItemPositions[id];
            const currentItem = document.items.find((item) => item.id === id);

            if (initialItemPos && currentItem) {
              const itemWidth = currentItem.width || 60;
              const itemHeight = currentItem.height || 60;

              // Calculate max movement in each direction for this item
              const itemMaxDeltaXPos =
                document.stage.width - itemWidth - initialItemPos.x;
              const itemMaxDeltaXNeg = -initialItemPos.x;
              const itemMaxDeltaYPos =
                document.stage.height - itemHeight - initialItemPos.y;
              const itemMaxDeltaYNeg = -initialItemPos.y;

              // If moving right and this item is more constrained, update maxDeltaX
              if (maxDeltaX > 0 && itemMaxDeltaXPos < maxDeltaX) {
                maxDeltaX = Math.floor(itemMaxDeltaXPos); // Use Math.floor to prevent protrusion
              }

              // If moving left and this item is more constrained, update maxDeltaX
              if (maxDeltaX < 0 && itemMaxDeltaXNeg > maxDeltaX) {
                maxDeltaX = Math.ceil(itemMaxDeltaXNeg); // Use Math.ceil to prevent protrusion
              }

              // If moving down and this item is more constrained, update maxDeltaY
              if (maxDeltaY > 0 && itemMaxDeltaYPos < maxDeltaY) {
                maxDeltaY = Math.floor(itemMaxDeltaYPos); // Use Math.floor to prevent protrusion
              }

              // If moving up and this item is more constrained, update maxDeltaY
              if (maxDeltaY < 0 && itemMaxDeltaYNeg > maxDeltaY) {
                maxDeltaY = Math.ceil(itemMaxDeltaYNeg); // Use Math.ceil to prevent protrusion
              }
            }
          }
        });
      }

      // Apply grid snapping to the maximum delta if enabled
      if (snapToGrid) {
        const { gridSize } = document.stage;

        // Apply grid snapping
        maxDeltaX = Math.round(maxDeltaX / gridSize) * gridSize;
        maxDeltaY = Math.round(maxDeltaY / gridSize) * gridSize;

        // Special case handling for edge snapping
        // If we're very close to an edge, allow snapping exactly to the edge
        Object.keys(initialItemPositions).forEach((id) => {
          if (selectedItems.has(id)) {
            const initialItemPos = initialItemPositions[id];
            const currentItem = document.items.find((item) => item.id === id);

            if (initialItemPos && currentItem) {
              const itemWidth = currentItem.width || 60;
              const itemHeight = currentItem.height || 60;

              // Calculate final position after applying delta
              const finalX = initialItemPos.x + maxDeltaX;
              const finalY = initialItemPos.y + maxDeltaY;

              // If very close to left edge (within one grid cell)
              if (finalX < gridSize && finalX > 0) {
                maxDeltaX = -initialItemPos.x; // Snap to left edge (x=0)
              }

              // If very close to top edge (within one grid cell)
              if (finalY < gridSize && finalY > 0) {
                maxDeltaY = -initialItemPos.y; // Snap to top edge (y=0)
              }

              // If very close to right edge (within one grid cell)
              const distanceFromRight =
                document.stage.width - itemWidth - finalX;
              if (distanceFromRight < gridSize && distanceFromRight > 0) {
                maxDeltaX = document.stage.width - itemWidth - initialItemPos.x; // Snap to right edge
              }

              // If very close to bottom edge (within one grid cell)
              const distanceFromBottom =
                document.stage.height - itemHeight - finalY;
              if (distanceFromBottom < gridSize && distanceFromBottom > 0) {
                maxDeltaY =
                  document.stage.height - itemHeight - initialItemPos.y; // Snap to bottom edge
              }
            }
          }
        });
      }

      // Update positions of all selected items
      const newPositions = { ...selectedItemsPositions };

      Object.keys(initialItemPositions).forEach((id) => {
        if (selectedItems.has(id)) {
          const initialItemPos = initialItemPositions[id];
          const item = document.items.find((item) => item.id === id);

          if (initialItemPos && item) {
            const itemWidth = item.width || 60;
            const itemHeight = item.height || 60;

            // Apply the same constrained delta to all selected items
            const newX = initialItemPos.x + maxDeltaX;
            const newY = initialItemPos.y + maxDeltaY;

            // Final boundary check to absolutely ensure nothing protrudes
            // Use precise Math.min/max to allow exact edge alignment without rounding
            const boundedX = Math.min(
              document.stage.width - itemWidth,
              Math.max(0, newX)
            );
            const boundedY = Math.min(
              document.stage.height - itemHeight,
              Math.max(0, newY)
            );

            newPositions[id] = {
              x: boundedX,
              y: boundedY,
            };
          }
        }
      });

      setSelectedItemsPositions(newPositions);
    },
    [
      document.items,
      document.stage,
      draggedItem,
      initialItemPositions,
      isDragging,
      offset,
      selectedItems,
      selectedItemsPositions,
      snapToGrid,
      stageRect,
    ]
  );

  const handleOverlayMouseUp = useCallback(() => {
    if (isDragging) {
      // Update all selected items' positions in the document
      Object.entries(selectedItemsPositions).forEach(([itemId, position]) => {
        if (position) {
          documentService.updateItem(itemId, { position });
        }
      });
    }

    // Reset drag state
    setIsDragging(false);
    setDraggedItem(null);
    setStageRect(null);
    setInitialItemPositions({});
    setSelectedItemsPositions({});
  }, [documentService, isDragging, selectedItemsPositions]);

  // Delete an item
  const handleDeleteItem = useCallback(
    (itemId: string) => {
      documentService.removeItem(itemId);

      // Also remove from selection if present
      if (selectedItems.has(itemId)) {
        const newSelectedItems = new Set(selectedItems);
        newSelectedItems.delete(itemId);
        setSelectedItems(newSelectedItems);
      }
    },
    [documentService, selectedItems]
  );

  // Flip an item horizontally
  const handleFlipItem = useCallback(
    (itemId: string) => {
      const item = document.items.find((item) => item.id === itemId);
      if (item) {
        documentService.updateItem(itemId, {
          isFlipped: !item.isFlipped,
        });
      }
    },
    [document.items, documentService]
  );

  // Helper functions
  const isItemSelected = useCallback(
    (itemId: string) => {
      return selectedItems.has(itemId);
    },
    [selectedItems]
  );

  const getItemVisualPosition = useCallback(
    (itemId: string): Position | null => {
      return isDragging && selectedItemsPositions[itemId]
        ? selectedItemsPositions[itemId]
        : null;
    },
    [isDragging, selectedItemsPositions]
  );

  const state: StageState = {
    selectedItems,
    isDragging,
    draggedItem,
    offset,
    stageRect,
    initialItemPositions,
    selectedItemsPositions,
  };

  const actions: StageStateActions = {
    handleStageClick,
    handleItemSelect,
    handleMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
    handleDeleteItem,
    handleFlipItem,
    isItemSelected,
    getItemVisualPosition,
  };

  return [state, actions];
}
