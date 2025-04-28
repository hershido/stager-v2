import { useState, useCallback } from "react";
import { useDocumentService } from "../../../../services/documentService";
import { StageItem as StageItemType } from "../../../../types/document";

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

// Add a new interface for the lasso rectangle
interface LassoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Add interface for alignment guides
interface AlignmentGuide {
  orientation: "horizontal" | "vertical";
  position: number;
  start?: number;
  end?: number;
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

  // Lasso selection state
  isLassoActive: boolean;
  lassoStart: Position | null;
  lassoEnd: Position | null;
  lassoRect: LassoRect | null;

  // Alignment guides state
  alignmentGuides: AlignmentGuide[];
}

export interface StageStateActions {
  // Selection actions
  handleStageClick: (e: React.MouseEvent) => void;
  handleItemSelect: (e: React.MouseEvent, itemId: string) => void;
  selectAllItems: () => void;

  // Dragging actions
  handleMouseDown: (e: React.MouseEvent, itemId: string) => void;
  handleOverlayMouseMove: (e: React.MouseEvent) => void;
  handleOverlayMouseUp: () => void;

  // Lasso selection actions
  handleLassoStart: (e: React.MouseEvent) => void;
  handleLassoMove: (e: React.MouseEvent) => void;
  handleLassoEnd: () => void;

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

  // Lasso selection state
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState<Position | null>(null);
  const [lassoEnd, setLassoEnd] = useState<Position | null>(null);
  const [lassoRect, setLassoRect] = useState<LassoRect | null>(null);

  // Alignment guides state
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Clear selection when clicking on stage background (modified)
  const handleStageClick = useCallback(
    (e: React.MouseEvent) => {
      // Only clear if clicking directly on stage (not on an item)
      // and not starting a lasso selection
      if (e.target === e.currentTarget && !isLassoActive) {
        setSelectedItems(new Set());
      }
    },
    [isLassoActive]
  );

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

      // Focus the stage element to enable keyboard shortcuts
      const stageElement = (e.target as HTMLElement).closest(
        "[data-stage]"
      ) as HTMLElement;
      if (stageElement) {
        stageElement.focus();
      }
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
      } else {
        // If the item is already selected, still focus the stage for keyboard shortcuts
        const stageElement = (e.currentTarget as HTMLElement).closest(
          "[data-stage]"
        ) as HTMLElement;
        if (stageElement) {
          stageElement.focus();
        }
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

      // Clear any existing alignment guides
      setAlignmentGuides([]);

      // Prevent text selection during drag
      e.preventDefault();
    },
    [document.items, handleItemSelect, selectedItems]
  );

  // Helper function to detect alignment between items
  const detectAlignments = useCallback(
    (draggedItems: Set<string>, newPositions: SelectedItemsPositions) => {
      if (!draggedItem) return [];

      // Threshold for approximate alignment (in pixels)
      const alignmentThreshold = 5;
      const guides: AlignmentGuide[] = [];

      // Get the static (non-dragged) items
      const staticItems = document.items.filter(
        (item) => !draggedItems.has(item.id)
      );
      if (staticItems.length === 0) return [];

      // Get the dragged items with their current positions
      const movingItems = Array.from(draggedItems)
        .map((id) => {
          const item = document.items.find((item) => item.id === id);
          const position = newPositions[id] || item?.position;
          return { item, position };
        })
        .filter(({ item, position }) => item && position) as {
        item: StageItemType;
        position: Position;
      }[];

      // Iterate through each dragged item
      movingItems.forEach(({ item: draggedItem, position: dragPos }) => {
        const draggedLeft = dragPos.x;
        const draggedRight = dragPos.x + (draggedItem.width || 0);
        const draggedCenter = dragPos.x + (draggedItem.width || 0) / 2;
        const draggedTop = dragPos.y;
        const draggedBottom = dragPos.y + (draggedItem.height || 0);
        const draggedMiddle = dragPos.y + (draggedItem.height || 0) / 2;

        // For each static item, check for alignments
        staticItems.forEach((staticItem) => {
          // Skip self
          if (staticItem.id === draggedItem.id) return;

          const staticLeft = staticItem.position.x;
          const staticRight = staticItem.position.x + (staticItem.width || 0);
          const staticCenter =
            staticItem.position.x + (staticItem.width || 0) / 2;
          const staticTop = staticItem.position.y;
          const staticBottom = staticItem.position.y + (staticItem.height || 0);
          const staticMiddle =
            staticItem.position.y + (staticItem.height || 0) / 2;

          // Check for vertical alignments (left, center, right)
          if (Math.abs(draggedLeft - staticLeft) < alignmentThreshold) {
            guides.push({
              orientation: "vertical",
              position: staticLeft,
              start: Math.min(draggedTop, staticTop),
              end: Math.max(draggedBottom, staticBottom),
            });
          }

          if (Math.abs(draggedRight - staticRight) < alignmentThreshold) {
            guides.push({
              orientation: "vertical",
              position: staticRight,
              start: Math.min(draggedTop, staticTop),
              end: Math.max(draggedBottom, staticBottom),
            });
          }

          if (Math.abs(draggedCenter - staticCenter) < alignmentThreshold) {
            guides.push({
              orientation: "vertical",
              position: staticCenter,
              start: Math.min(draggedTop, staticTop),
              end: Math.max(draggedBottom, staticBottom),
            });
          }

          if (Math.abs(draggedLeft - staticRight) < alignmentThreshold) {
            guides.push({
              orientation: "vertical",
              position: staticRight,
              start: Math.min(draggedTop, staticTop),
              end: Math.max(draggedBottom, staticBottom),
            });
          }

          if (Math.abs(draggedRight - staticLeft) < alignmentThreshold) {
            guides.push({
              orientation: "vertical",
              position: staticLeft,
              start: Math.min(draggedTop, staticTop),
              end: Math.max(draggedBottom, staticBottom),
            });
          }

          // Check for horizontal alignments (top, middle, bottom)
          if (Math.abs(draggedTop - staticTop) < alignmentThreshold) {
            guides.push({
              orientation: "horizontal",
              position: staticTop,
              start: Math.min(draggedLeft, staticLeft),
              end: Math.max(draggedRight, staticRight),
            });
          }

          if (Math.abs(draggedBottom - staticBottom) < alignmentThreshold) {
            guides.push({
              orientation: "horizontal",
              position: staticBottom,
              start: Math.min(draggedLeft, staticLeft),
              end: Math.max(draggedRight, staticRight),
            });
          }

          if (Math.abs(draggedMiddle - staticMiddle) < alignmentThreshold) {
            guides.push({
              orientation: "horizontal",
              position: staticMiddle,
              start: Math.min(draggedLeft, staticLeft),
              end: Math.max(draggedRight, staticRight),
            });
          }

          if (Math.abs(draggedTop - staticBottom) < alignmentThreshold) {
            guides.push({
              orientation: "horizontal",
              position: staticBottom,
              start: Math.min(draggedLeft, staticLeft),
              end: Math.max(draggedRight, staticRight),
            });
          }

          if (Math.abs(draggedBottom - staticTop) < alignmentThreshold) {
            guides.push({
              orientation: "horizontal",
              position: staticTop,
              start: Math.min(draggedLeft, staticLeft),
              end: Math.max(draggedRight, staticRight),
            });
          }
        });
      });

      return guides;
    },
    [document.items, draggedItem]
  );

  // Helper function to apply snapping based on alignment guides
  const applyAlignmentSnapping = useCallback(
    (
      draggedIds: Set<string>,
      positions: SelectedItemsPositions,
      guides: AlignmentGuide[]
    ) => {
      if (guides.length === 0 || !draggedItem) return positions;

      const snappedPositions = { ...positions };

      // Get main dragged item info
      const mainItem = document.items.find((item) => item.id === draggedItem);
      if (!mainItem) return positions;

      const mainPosition = positions[draggedItem] || mainItem.position;

      // For each guide, calculate the offset to apply
      let xOffset = 0;
      let yOffset = 0;

      // Process vertical guides (affecting x position)
      const verticalGuides = guides.filter((g) => g.orientation === "vertical");
      if (verticalGuides.length > 0) {
        // Get the first guide to snap to (could be improved to find the closest one)
        const guide = verticalGuides[0];

        // Calculate the main item's edges
        const mainLeft = mainPosition.x;
        const mainRight = mainLeft + (mainItem.width || 0);
        const mainCenter = mainLeft + (mainItem.width || 0) / 2;

        // Determine which edge to snap
        if (
          Math.abs(guide.position - mainLeft) <
            Math.abs(guide.position - mainCenter) &&
          Math.abs(guide.position - mainLeft) <
            Math.abs(guide.position - mainRight)
        ) {
          // Snap left edge
          xOffset = guide.position - mainLeft;
        } else if (
          Math.abs(guide.position - mainRight) <
            Math.abs(guide.position - mainCenter) &&
          Math.abs(guide.position - mainRight) <
            Math.abs(guide.position - mainLeft)
        ) {
          // Snap right edge
          xOffset = guide.position - mainRight;
        } else {
          // Snap center
          xOffset = guide.position - mainCenter;
        }
      }

      // Process horizontal guides (affecting y position)
      const horizontalGuides = guides.filter(
        (g) => g.orientation === "horizontal"
      );
      if (horizontalGuides.length > 0) {
        // Get the first guide to snap to
        const guide = horizontalGuides[0];

        // Calculate the main item's edges
        const mainTop = mainPosition.y;
        const mainBottom = mainTop + (mainItem.height || 0);
        const mainMiddle = mainTop + (mainItem.height || 0) / 2;

        // Determine which edge to snap
        if (
          Math.abs(guide.position - mainTop) <
            Math.abs(guide.position - mainMiddle) &&
          Math.abs(guide.position - mainTop) <
            Math.abs(guide.position - mainBottom)
        ) {
          // Snap top edge
          yOffset = guide.position - mainTop;
        } else if (
          Math.abs(guide.position - mainBottom) <
            Math.abs(guide.position - mainMiddle) &&
          Math.abs(guide.position - mainBottom) <
            Math.abs(guide.position - mainTop)
        ) {
          // Snap bottom edge
          yOffset = guide.position - mainBottom;
        } else {
          // Snap middle
          yOffset = guide.position - mainMiddle;
        }
      }

      // Apply the offsets to all dragged items
      Array.from(draggedIds).forEach((id) => {
        const pos = snappedPositions[id];
        if (pos) {
          snappedPositions[id] = {
            x: pos.x + xOffset,
            y: pos.y + yOffset,
          };
        }
      });

      return snappedPositions;
    },
    [document.items, draggedItem]
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
            let newX = initialItemPos.x + maxDeltaX;
            let newY = initialItemPos.y + maxDeltaY;

            // If snap is enabled, snap the final position directly to grid
            if (snapToGrid) {
              const { gridSize } = document.stage;
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
            }

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

      // Detect alignment with other items and show guides
      const guides = detectAlignments(selectedItems, newPositions);

      // Apply alignment snapping if there are guides
      const snappedPositions =
        guides.length > 0
          ? applyAlignmentSnapping(selectedItems, newPositions, guides)
          : newPositions;

      // Update alignment guides for visual display
      setAlignmentGuides(guides);

      // Update item positions with snapped values
      setSelectedItemsPositions(snappedPositions);
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
      detectAlignments,
      applyAlignmentSnapping,
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

    // Clear alignment guides
    setAlignmentGuides([]);
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

  // Select all items on the stage
  const selectAllItems = useCallback(() => {
    const newSelectedItems = new Set<string>();
    document.items.forEach((item) => {
      newSelectedItems.add(item.id);
    });
    setSelectedItems(newSelectedItems);
  }, [document.items]);

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

  // Helper function to calculate lasso rectangle from start and end points
  const calculateLassoRect = useCallback(
    (start: Position, end: Position): LassoRect => {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      return { x, y, width, height };
    },
    []
  );

  // Get a rectangle representing an item's bounds
  const getItemRect = useCallback(
    (item: {
      position: Position;
      width?: number;
      height?: number;
    }): LassoRect => {
      return {
        x: item.position.x,
        y: item.position.y,
        width: item.width || 60,
        height: item.height || 60,
      };
    },
    []
  );

  // Check if two rectangles are intersecting
  const isRectIntersecting = useCallback(
    (rect1: LassoRect, rect2: LassoRect): boolean => {
      const rect1Right = rect1.x + rect1.width;
      const rect1Bottom = rect1.y + rect1.height;
      const rect2Right = rect2.x + rect2.width;
      const rect2Bottom = rect2.y + rect2.height;

      return (
        rect1.x < rect2Right &&
        rect1Right > rect2.x &&
        rect1.y < rect2Bottom &&
        rect1Bottom > rect2.y
      );
    },
    []
  );

  // Check if an item is inside the lasso rectangle
  const isItemInLasso = useCallback(
    (
      item: { position: Position; width?: number; height?: number },
      rect: LassoRect
    ): boolean => {
      const itemRect = getItemRect(item);
      return isRectIntersecting(rect, itemRect);
    },
    [getItemRect, isRectIntersecting]
  );

  // Start lasso selection
  const handleLassoStart = useCallback((e: React.MouseEvent) => {
    // Only start lasso if clicking directly on the stage (not on an item)
    if (e.target !== e.currentTarget) return;

    // Skip if right-button
    if (e.button === 2) return;

    // Get the stage element's bounding rectangle
    const currentStageRect = (
      e.currentTarget as HTMLElement
    ).getBoundingClientRect();
    if (!currentStageRect) return;

    setStageRect(currentStageRect);

    // Calculate the mouse position relative to the stage
    const startPos = {
      x: e.clientX - currentStageRect.left,
      y: e.clientY - currentStageRect.top,
    };

    setLassoStart(startPos);
    setLassoEnd(startPos);
    setLassoRect({ x: startPos.x, y: startPos.y, width: 0, height: 0 });
    setIsLassoActive(true);

    // If shift key isn't pressed, clear current selection
    if (!e.shiftKey) {
      setSelectedItems(new Set());
    }

    // Prevent default behaviors
    e.preventDefault();
  }, []);

  // Move lasso selection
  const handleLassoMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isLassoActive || !lassoStart || !stageRect) return;

      // Calculate current mouse position relative to stage
      const mousePosition = {
        x: e.clientX - stageRect.left,
        y: e.clientY - stageRect.top,
      };

      // Update lasso end point and calculate rectangle
      setLassoEnd(mousePosition);
      const rect = calculateLassoRect(lassoStart, mousePosition);
      setLassoRect(rect);

      // Update selected items in real-time
      const itemsInLasso = document.items.filter((item) =>
        isItemInLasso(item, rect)
      );

      // Update selection based on whether shift key is pressed
      if (e.shiftKey) {
        // Add to existing selection
        setSelectedItems((prev) => {
          const newSelection = new Set(prev);
          itemsInLasso.forEach((item) => newSelection.add(item.id));
          return newSelection;
        });
      } else {
        // New selection
        setSelectedItems(new Set(itemsInLasso.map((item) => item.id)));
      }
    },
    [
      isLassoActive,
      lassoStart,
      stageRect,
      document.items,
      calculateLassoRect,
      isItemInLasso,
      setLassoEnd,
      setLassoRect,
      setSelectedItems,
    ]
  );

  // End lasso select
  const handleLassoEnd = useCallback(() => {
    if (!isLassoActive) return;

    // Reset lasso state
    setIsLassoActive(false);
    setLassoStart(null);
    setLassoEnd(null);
    setLassoRect(null);
  }, [isLassoActive]);

  const state: StageState = {
    selectedItems,
    isDragging,
    draggedItem,
    offset,
    stageRect,
    initialItemPositions,
    selectedItemsPositions,
    isLassoActive,
    lassoStart,
    lassoEnd,
    lassoRect,
    alignmentGuides,
  };

  const actions: StageStateActions = {
    handleStageClick,
    handleItemSelect,
    selectAllItems,
    handleMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
    handleLassoStart,
    handleLassoMove,
    handleLassoEnd,
    handleDeleteItem,
    handleFlipItem,
    isItemSelected,
    getItemVisualPosition,
  };

  return [state, actions];
}
