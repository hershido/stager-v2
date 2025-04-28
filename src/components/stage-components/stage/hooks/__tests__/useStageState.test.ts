import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useStageState } from "../useStageState";
import { useDocumentService } from "../../../../../services/documentService";

// Mock document service
vi.mock("../../../../../services/documentService", () => ({
  useDocumentService: vi.fn(),
}));

describe("useStageState", () => {
  // Mock document with items
  const mockItems = [
    {
      id: "item-1",
      name: "Test Item 1",
      position: { x: 100, y: 100 },
      width: 100,
      height: 100,
    },
    {
      id: "item-2",
      name: "Test Item 2",
      position: { x: 200, y: 200 },
      width: 80,
      height: 80,
    },
  ];

  // Mock document
  const mockDocument = {
    items: mockItems,
    stage: {
      width: 1000,
      height: 800,
      gridSize: 20,
    },
  };

  // Mock document service functions
  const mockUpdateItem = vi.fn();
  const mockRemoveItem = vi.fn();
  const mockDocumentService = {
    updateItem: mockUpdateItem,
    removeItem: mockRemoveItem,
  };

  // Create a mock DOM element with the necessary methods
  const createMockElement = () => {
    const mockElement = {
      focus: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
      }),
      closest: vi.fn().mockImplementation((selector) => {
        if (selector === "[data-stage]") {
          return mockElement; // Return itself when looking for the stage element
        }
        return null;
      }),
    };
    return mockElement;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup document service mock
    (useDocumentService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      {
        document: mockDocument,
        documentService: mockDocumentService,
      }
    );
  });

  test("initial state should be empty", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    const [state] = result.current;

    expect(state.selectedItems.size).toBe(0);
    expect(state.isDragging).toBe(false);
    expect(state.draggedItem).toBe(null);
  });

  test("handleStageClick should clear selection", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // First select an item by directly modifying the Set
    act(() => {
      result.current[0].selectedItems.add("item-1");
    });

    // Verify item is selected
    expect(result.current[0].selectedItems.has("item-1")).toBe(true);

    // Then click on the stage background
    act(() => {
      const [, actions] = result.current;
      // Mock event that directly targets the stage (target === currentTarget)
      const mockEvent = {
        target: "stage-element",
        currentTarget: "stage-element",
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent;

      actions.handleStageClick(mockEvent);
    });

    // Selection should be cleared
    expect(result.current[0].selectedItems.size).toBe(0);
  });

  test("handleItemSelect should select a single item", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    act(() => {
      const [, actions] = result.current;
      const mockElement = createMockElement();
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: false,
        target: mockElement,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-1");
    });

    // Should have one item selected
    expect(result.current[0].selectedItems.size).toBe(1);
    expect(result.current[0].selectedItems.has("item-1")).toBe(true);
  });

  test("handleItemSelect with shift key should toggle selection", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // First select an item without shift
    act(() => {
      const [, actions] = result.current;
      const mockElement = createMockElement();
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: false,
        target: mockElement,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-1");
    });

    // Now toggle another item with shift key
    act(() => {
      const [, actions] = result.current;
      const mockElement = createMockElement();
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: true,
        target: mockElement,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-2");
    });

    // Should have both items selected
    expect(result.current[0].selectedItems.size).toBe(2);
    expect(result.current[0].selectedItems.has("item-1")).toBe(true);
    expect(result.current[0].selectedItems.has("item-2")).toBe(true);

    // Toggle one off with shift key
    act(() => {
      const [, actions] = result.current;
      const mockElement = createMockElement();
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: true,
        target: mockElement,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-1");
    });

    // Should have only item-2 selected now
    expect(result.current[0].selectedItems.size).toBe(1);
    expect(result.current[0].selectedItems.has("item-1")).toBe(false);
    expect(result.current[0].selectedItems.has("item-2")).toBe(true);
  });

  test("handleDeleteItem should remove item and update selection", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // First select an item
    act(() => {
      result.current[0].selectedItems.add("item-1");
    });

    expect(result.current[0].selectedItems.has("item-1")).toBe(true);

    // Now delete it
    act(() => {
      const [, actions] = result.current;
      actions.handleDeleteItem("item-1");
    });

    // Selection should be empty
    expect(result.current[0].selectedItems.size).toBe(0);
    // Document service should be called
    expect(mockRemoveItem).toHaveBeenCalledWith("item-1");
  });

  test("isItemSelected should return correct state", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // Add an item to selection directly
    act(() => {
      result.current[0].selectedItems.add("item-1");
    });

    const [, actions] = result.current;
    expect(actions.isItemSelected("item-1")).toBe(true);
    expect(actions.isItemSelected("item-2")).toBe(false);
  });

  test("handleFlipItem should toggle item flip state", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    act(() => {
      const [, actions] = result.current;
      actions.handleFlipItem("item-1");
    });

    // Should call documentService.updateItem with the flipped state
    expect(mockUpdateItem).toHaveBeenCalledWith("item-1", { isFlipped: true });
  });

  test("getItemVisualPosition should return null when not dragging", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    const [, actions] = result.current;
    const position = actions.getItemVisualPosition("item-1");

    expect(position).toBeNull();
  });

  test("snapToGrid snaps positions to grid lines when dragging", () => {
    // Create hook with snapToGrid enabled
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // Get the grid size from mock document
    const gridSize = mockDocument.stage.gridSize; // 20

    // Simulate mouse down on an item (start drag)
    act(() => {
      const mockElement = createMockElement();
      const mockEvent = {
        button: 0,
        target: mockElement,
        currentTarget: mockElement,
        clientX: 150,
        clientY: 150,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        shiftKey: false,
      } as unknown as React.MouseEvent;

      result.current[1].handleMouseDown(mockEvent, "item-1");
    });

    // Verify dragging started correctly
    expect(result.current[0].isDragging).toBe(true);
    expect(result.current[0].draggedItem).toBe("item-1");

    // Simulate mouse move to a non-grid-aligned position
    act(() => {
      const mockEvent = {
        clientX: 163, // Not a multiple of gridSize (20)
        clientY: 177, // Not a multiple of gridSize (20)
      } as unknown as React.MouseEvent;

      result.current[1].handleOverlayMouseMove(mockEvent);
    });

    // Get the position after mouse move
    const visualPos = result.current[0].selectedItemsPositions["item-1"];

    // Test that our grid snapping is working
    expect(visualPos).toBeDefined();
    if (visualPos) {
      // Key assertion: both coordinates should be divisible by gridSize
      // This is testing our fix - ensuring the final position is snapped to grid
      expect(visualPos.x % gridSize).toBe(0);
      expect(visualPos.y % gridSize).toBe(0);
    }
  });

  test("handleLassoMove selects items in real-time as lasso is dragged", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // First setup lasso start
    act(() => {
      const [, actions] = result.current;

      // Create a mock element with getBoundingClientRect
      const mockElement = createMockElement();

      // Create a mock event for lasso start
      const mockStartEvent = {
        target: mockElement,
        currentTarget: mockElement,
        button: 0, // Left mouse button
        clientX: 100, // Starting coordinates (will be 100-50=50 relative to element)
        clientY: 100,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      // Start lasso selection
      actions.handleLassoStart(mockStartEvent);
    });

    // Verify lasso is active
    expect(result.current[0].isLassoActive).toBe(true);
    expect(result.current[0].lassoStart).toEqual({ x: 50, y: 50 }); // 100-50=50 for both

    // Initially no items should be selected
    expect(result.current[0].selectedItems.size).toBe(0);

    // Now simulate dragging the lasso to cover item-1
    act(() => {
      const [, actions] = result.current;

      // Create a mock event for lasso move
      const mockMoveEvent = {
        clientX: 200, // Drag to cover item-1 at (100, 100), adjusting for mockElement offset (50, 50)
        clientY: 200,
        shiftKey: false,
      } as unknown as React.MouseEvent;

      // Move lasso
      actions.handleLassoMove(mockMoveEvent);
    });

    // Verify item-1 is selected in real-time during lasso drag
    expect(result.current[0].selectedItems.size).toBe(1);
    expect(result.current[0].selectedItems.has("item-1")).toBe(true);

    // Now extend lasso to also cover item-2
    act(() => {
      const [, actions] = result.current;

      // Create a mock event for lasso move
      const mockMoveEvent = {
        clientX: 300, // Drag to cover both items, adjusted for mockElement offset
        clientY: 300,
        shiftKey: false,
      } as unknown as React.MouseEvent;

      // Move lasso
      actions.handleLassoMove(mockMoveEvent);
    });

    // Verify both items are selected in real-time
    expect(result.current[0].selectedItems.size).toBe(2);
    expect(result.current[0].selectedItems.has("item-1")).toBe(true);
    expect(result.current[0].selectedItems.has("item-2")).toBe(true);

    // Now test shift key behavior - move lasso back to only cover item-1 with shift key
    act(() => {
      const [, actions] = result.current;

      // Create a mock event for lasso move with shift key
      const mockMoveEvent = {
        clientX: 200, // Adjusted for mockElement offset
        clientY: 200,
        shiftKey: true, // Hold shift key
      } as unknown as React.MouseEvent;

      // Move lasso with shift key
      actions.handleLassoMove(mockMoveEvent);
    });

    // Verify both items remain selected when using shift
    expect(result.current[0].selectedItems.size).toBe(2);

    // End the lasso selection
    act(() => {
      const [, actions] = result.current;
      actions.handleLassoEnd();
    });

    // Verify lasso state is reset
    expect(result.current[0].isLassoActive).toBe(false);
    expect(result.current[0].lassoRect).toBe(null);

    // But selection remains
    expect(result.current[0].selectedItems.size).toBe(2);
  });

  test("alignmentGuides should be initialized as an empty array", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));
    const [state] = result.current;

    expect(state.alignmentGuides).toEqual([]);
  });

  test("handleMouseDown should clear alignment guides", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // Mock the state to have some alignment guides initially
    act(() => {
      const state = result.current[0];
      state.alignmentGuides = [{ orientation: "horizontal", position: 100 }];
    });

    // Verify guides are present
    expect(result.current[0].alignmentGuides.length).toBe(1);

    // Trigger mouse down on an item
    act(() => {
      const [, actions] = result.current;
      const mockElement = createMockElement();
      const mockEvent = {
        button: 0, // Left click
        target: mockElement,
        currentTarget: mockElement,
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
        shiftKey: false,
        clientX: 150,
        clientY: 150,
      } as unknown as React.MouseEvent;

      actions.handleMouseDown(mockEvent, "item-1");
    });

    // Alignment guides should be cleared
    expect(result.current[0].alignmentGuides).toEqual([]);
  });

  test("handleOverlayMouseUp should clear alignment guides", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    // Setup dragging state and alignment guides
    act(() => {
      const state = result.current[0];
      state.isDragging = true;
      state.alignmentGuides = [
        { orientation: "vertical", position: 200 },
        { orientation: "horizontal", position: 150 },
      ];
      state.selectedItemsPositions = { "item-1": { x: 100, y: 100 } };
    });

    // Verify guides are present
    expect(result.current[0].alignmentGuides.length).toBe(2);

    // Trigger mouse up to end dragging
    act(() => {
      const [, actions] = result.current;
      actions.handleOverlayMouseUp();
    });

    // Alignment guides should be cleared
    expect(result.current[0].alignmentGuides).toEqual([]);
    expect(result.current[0].isDragging).toBe(false);
  });
});
