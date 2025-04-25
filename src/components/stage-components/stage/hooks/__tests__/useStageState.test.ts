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

    // First select an item
    act(() => {
      const [, actions] = result.current;
      // Mock event that directly targets the stage (target === currentTarget)
      const mockEvent = {
        target: "stage-element",
        currentTarget: "stage-element",
      } as unknown as React.MouseEvent;

      // Simulate selecting an item first
      result.current[0].selectedItems.add("item-1");

      // Then click on the stage background
      actions.handleStageClick(mockEvent);
    });

    // Selection should be cleared
    expect(result.current[0].selectedItems.size).toBe(0);
  });

  test("handleItemSelect should select a single item", () => {
    const { result } = renderHook(() => useStageState({ snapToGrid: true }));

    act(() => {
      const [, actions] = result.current;
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: false,
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
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: false,
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-1");
    });

    // Now toggle another item with shift key
    act(() => {
      const [, actions] = result.current;
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: true,
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
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: true,
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
      const [, actions] = result.current;
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: false,
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-1");
    });

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

    // First select an item
    act(() => {
      const [, actions] = result.current;
      const mockEvent = {
        stopPropagation: vi.fn(),
        shiftKey: false,
      } as unknown as React.MouseEvent;

      actions.handleItemSelect(mockEvent, "item-1");
    });

    const [, actions] = result.current;
    expect(actions.isItemSelected("item-1")).toBe(true);
    expect(actions.isItemSelected("item-2")).toBe(false);
  });

  // Additional tests for dragging behavior would be valuable but require more complex mock setup
  // for mouse events and DOM elements
});
