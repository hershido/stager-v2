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
});
