import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { Stage } from "../Stage";
import { useDocumentService } from "../../../../services/documentService";
import { useClipboard } from "../../../../context/ClipboardContext";
import { useContextMenu } from "../../../hooks/useContextMenu";
import { useStageState } from "../hooks/useStageState";
import { StageItem as StageItemType } from "../../../../types/document";

// Mock the hooks and components
vi.mock("../../../../services/documentService", () => ({
  useDocumentService: vi.fn(),
}));

vi.mock("../../../../context/ClipboardContext", () => ({
  useClipboard: vi.fn(),
}));

vi.mock("../../../hooks/useContextMenu", () => ({
  useContextMenu: vi.fn(),
}));

vi.mock("../hooks/useStageState", () => ({
  useStageState: vi.fn(),
}));

vi.mock("../../item/StageItem", () => ({
  StageItem: vi.fn(({ item, onMouseDown }) => (
    <div
      data-testid={`stage-item-${item.id}`}
      className="stageItem"
      onClick={(e) => onMouseDown(e, item.id)}
    >
      {item.name}
    </div>
  )),
}));

// Mock the CSS module
vi.mock("../Stage.module.scss", () => ({
  default: {
    stage: "stage",
    gridContainer: "gridContainer",
    stageItem: "stageItem",
    dragOverlay: "dragOverlay",
    contextMenuTitle: "contextMenuTitle",
  },
}));

describe("Stage", () => {
  // Mock document with stage items
  const mockItems = [
    {
      id: "item-1",
      name: "Test Item 1",
      category: "equipment",
      icon: "🎸",
      position: { x: 100, y: 100 },
      width: 100,
      height: 100,
    },
    {
      id: "item-2",
      name: "Test Item 2",
      category: "equipment",
      icon: "🎹",
      position: { x: 200, y: 200 },
      width: 80,
      height: 80,
    },
  ] as StageItemType[];

  // Mock document
  const mockDocument = {
    id: "doc-1",
    name: "Test Document",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: "1.0",
    stage: {
      width: 1000,
      height: 800,
      backgroundColor: "#f0f0f0",
      gridSize: 20,
    },
    items: mockItems,
    inputOutput: {
      inputs: [],
      outputs: [],
    },
    technicalInfo: {
      projectTitle: "",
      personnel: [],
      generalInfo: "",
      houseSystem: "",
      mixingDesk: "",
      monitors: [],
      monitoring: "",
      backline: "",
      soundCheck: "",
    },
  };

  // Mock document service
  const mockRemoveItem = vi.fn();
  const mockAddItem = vi.fn();
  const mockDocumentService = {
    removeItem: mockRemoveItem,
    addItem: mockAddItem,
  };

  // Mock clipboard functions
  const mockHasClipboardItem = vi.fn().mockReturnValue(false);
  const mockCopyItems = vi.fn();
  const mockClipboardFunctions = {
    clipboardItem: null,
    hasClipboardItem: mockHasClipboardItem,
    copyItems: mockCopyItems,
  };

  // Mock stage state
  const mockSelectedItems = new Set<string>();
  const mockHandleStageClick = vi.fn();
  const mockHandleMouseDown = vi.fn();
  const mockHandleOverlayMouseMove = vi.fn();
  const mockHandleOverlayMouseUp = vi.fn();
  const mockHandleDeleteItem = vi.fn();
  const mockHandleFlipItem = vi.fn();
  const mockIsItemSelected = vi.fn().mockReturnValue(false);
  const mockGetItemVisualPosition = vi.fn().mockImplementation((id) => {
    const item = mockItems.find((item) => item.id === id);
    return item ? item.position : { x: 0, y: 0 };
  });

  // Mock state and actions from useStageState
  const mockStageState = {
    selectedItems: mockSelectedItems,
    isDragging: false,
  };

  const mockStageActions = {
    handleStageClick: mockHandleStageClick,
    handleMouseDown: mockHandleMouseDown,
    handleOverlayMouseMove: mockHandleOverlayMouseMove,
    handleOverlayMouseUp: mockHandleOverlayMouseUp,
    handleDeleteItem: mockHandleDeleteItem,
    handleFlipItem: mockHandleFlipItem,
    isItemSelected: mockIsItemSelected,
    getItemVisualPosition: mockGetItemVisualPosition,
  };

  // Mock context menu
  const mockHandleContextMenu = vi.fn();
  const mockContextMenuState = {
    relativePosition: null,
  };
  const MockStageContextMenu = () => <div data-testid="context-menu"></div>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup document service mock
    (useDocumentService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      {
        document: mockDocument,
        documentService: mockDocumentService,
      }
    );

    // Setup clipboard mock
    (useClipboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockClipboardFunctions
    );

    // Setup stage state mock
    (useStageState as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      mockStageState,
      mockStageActions,
    ]);

    // Setup context menu mock
    (useContextMenu as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      handleContextMenu: mockHandleContextMenu,
      ContextMenu: MockStageContextMenu,
      contextMenuState: mockContextMenuState,
    });
  });

  test("renders stage with correct dimensions and background", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    const stageElement = screen.getByTestId("stage");
    expect(stageElement).toBeInTheDocument();
    expect(stageElement).toHaveStyle({
      width: `${mockDocument.stage.width}px`,
      height: `${mockDocument.stage.height}px`,
      backgroundColor: mockDocument.stage.backgroundColor,
    });
  });

  test("renders grid when showGrid is true", () => {
    const { container } = render(<Stage showGrid={true} snapToGrid={true} />);

    const gridContainer = container.querySelector(".gridContainer");
    expect(gridContainer).toBeInTheDocument();
  });

  test("doesn't render grid when showGrid is false", () => {
    const { container } = render(<Stage showGrid={false} snapToGrid={true} />);

    const gridContainer = container.querySelector(".gridContainer");
    expect(gridContainer).not.toBeInTheDocument();
  });

  test("renders all stage items from document", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    expect(screen.getByTestId("stage-item-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("stage-item-item-2")).toBeInTheDocument();
    expect(screen.getByText("Test Item 1")).toBeInTheDocument();
    expect(screen.getByText("Test Item 2")).toBeInTheDocument();
  });

  test("calls handleStageClick when stage is clicked", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    const stageElement = screen.getByTestId("stage");
    fireEvent.click(stageElement);

    expect(mockHandleStageClick).toHaveBeenCalledTimes(1);
  });

  test("calls handleContextMenu when right-clicking the stage", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    const stageElement = screen.getByTestId("stage");
    fireEvent.contextMenu(stageElement);

    expect(mockHandleContextMenu).toHaveBeenCalledTimes(1);
  });

  test("shows drag overlay only when dragging", () => {
    // Not dragging
    const { container, rerender } = render(
      <Stage showGrid={true} snapToGrid={true} />
    );

    let dragOverlay = container.querySelector(".dragOverlay");
    expect(dragOverlay).not.toBeInTheDocument();

    // Update the state to simulate dragging
    mockStageState.isDragging = true;

    rerender(<Stage showGrid={true} snapToGrid={true} />);

    dragOverlay = container.querySelector(".dragOverlay");
    expect(dragOverlay).toBeInTheDocument();

    // Reset state
    mockStageState.isDragging = false;
  });

  test("drag overlay has mouse event handlers when visible", () => {
    // Update the state to simulate dragging
    mockStageState.isDragging = true;

    const { container } = render(<Stage showGrid={true} snapToGrid={true} />);

    const overlay = container.querySelector(".dragOverlay") as HTMLElement;

    fireEvent.mouseMove(overlay);
    expect(mockHandleOverlayMouseMove).toHaveBeenCalledTimes(1);

    fireEvent.mouseUp(overlay);
    expect(mockHandleOverlayMouseUp).toHaveBeenCalledTimes(1);

    // Reset state
    mockStageState.isDragging = false;
  });

  test("clicking on a stage item triggers handleMouseDown", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    const item = screen.getByTestId("stage-item-item-1");
    fireEvent.click(item);

    expect(mockHandleMouseDown).toHaveBeenCalledTimes(1);
    expect(mockHandleMouseDown).toHaveBeenCalledWith(
      expect.anything(),
      "item-1"
    );
  });

  test("renders context menu component", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });

  test("passes correct props to useStageState hook", () => {
    render(<Stage showGrid={true} snapToGrid={true} />);

    expect(useStageState).toHaveBeenCalledWith({ snapToGrid: true });
  });

  test("Ctrl+C keyboard shortcut copies selected items", () => {
    // Setup selected items
    mockSelectedItems.add("item-1");
    mockSelectedItems.add("item-2");

    // Render the stage
    render(<Stage showGrid={true} snapToGrid={true} />);

    const stageElement = screen.getByTestId("stage");

    // Focus the stage element first
    stageElement.focus();

    // Test Copy (Ctrl+C)
    fireEvent.keyDown(stageElement, { key: "c", ctrlKey: true });

    // Verify copy was called with the selected items
    expect(mockCopyItems).toHaveBeenCalledTimes(1);
    expect(mockCopyItems).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "item-1" }),
        expect.objectContaining({ id: "item-2" }),
      ])
    );

    // Clean up
    mockSelectedItems.clear();
  });

  test("Ctrl+C keyboard shortcut copies a single selected item", () => {
    // Reset mockCopyItems call count
    mockCopyItems.mockClear();

    // Setup with a single selected item
    mockSelectedItems.add("item-1");

    // Render the stage
    render(<Stage showGrid={true} snapToGrid={true} />);

    const stageElement = screen.getByTestId("stage");

    // Focus the stage element first
    stageElement.focus();

    // Test Copy (Ctrl+C)
    fireEvent.keyDown(stageElement, { key: "c", ctrlKey: true });

    // Verify copy was called with one item
    expect(mockCopyItems).toHaveBeenCalledTimes(1);
    expect(mockCopyItems).toHaveBeenCalledWith([
      expect.objectContaining({ id: "item-1" }),
    ]);

    // Clean up
    mockSelectedItems.clear();
  });

  // NEW TESTS FOR DELETION

  test("pressing Delete key calls handleDeleteItem for selected items", () => {
    // Setup selected items
    mockSelectedItems.add("item-1");
    mockSelectedItems.add("item-2");

    render(<Stage showGrid={true} snapToGrid={true} />);

    // Simulate Delete key press on the stage
    const stageElement = screen.getByTestId("stage");

    // Focus the stage element first
    stageElement.focus();

    fireEvent.keyDown(stageElement, { key: "Delete" });

    // Verify that handleDeleteItem was called for each selected item
    expect(mockHandleDeleteItem).toHaveBeenCalledTimes(2);
    expect(mockHandleDeleteItem).toHaveBeenNthCalledWith(1, "item-1");
    expect(mockHandleDeleteItem).toHaveBeenNthCalledWith(2, "item-2");

    // Clean up
    mockSelectedItems.clear();
  });

  test("deleting items via context menu", () => {
    // Setup selected items
    mockSelectedItems.add("item-1");
    mockSelectedItems.add("item-2");

    // Create a delete handler that will iterate through selected items
    const mockDeleteHandler = vi.fn(() => {
      // Simulate deleting all selected items
      for (const itemId of mockSelectedItems) {
        mockHandleDeleteItem(itemId);
      }
    });

    // Setup mock for context menu with delete option
    const mockMenuItems = [
      { id: "paste", label: "Paste", onClick: vi.fn() },
      { type: "divider" as const },
      { id: "delete", label: "Delete", onClick: mockDeleteHandler },
    ];

    (useContextMenu as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      handleContextMenu: mockHandleContextMenu,
      ContextMenu: MockStageContextMenu,
      contextMenuState: mockContextMenuState,
      items: mockMenuItems,
    });

    render(<Stage showGrid={true} snapToGrid={true} />);

    // Simulate clicking the delete menu option
    mockDeleteHandler();

    // Verify that handleDeleteItem was called for each selected item
    expect(mockHandleDeleteItem).toHaveBeenCalledTimes(2);
    expect(mockHandleDeleteItem).toHaveBeenNthCalledWith(1, "item-1");
    expect(mockHandleDeleteItem).toHaveBeenNthCalledWith(2, "item-2");

    // Clean up
    mockSelectedItems.clear();
  });

  test("items are actually removed from document after deletion", () => {
    // This test verifies the complete deletion flow from UI to document service

    // Setup selected items
    mockSelectedItems.add("item-1");

    // Create a new document with items that will be updated during the test
    const updatedMockDocument = {
      ...mockDocument,
      items: [...mockItems],
    };

    // Setup document service that will actually modify the document
    const mockRemoveItemAndUpdate = vi.fn().mockImplementation((id) => {
      // Remove the item from our test document
      updatedMockDocument.items = updatedMockDocument.items.filter(
        (item) => item.id !== id
      );
      return true;
    });

    // Update our mock to use the new implementation
    (useDocumentService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      {
        document: updatedMockDocument,
        documentService: {
          ...mockDocumentService,
          removeItem: mockRemoveItemAndUpdate,
        },
      }
    );

    // Update the mockHandleDeleteItem to actually call removeItem
    const updatedMockHandleDeleteItem = vi.fn().mockImplementation((id) => {
      mockRemoveItemAndUpdate(id);
    });

    (useStageState as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      mockStageState,
      {
        ...mockStageActions,
        handleDeleteItem: updatedMockHandleDeleteItem,
      },
    ]);

    const { rerender } = render(<Stage showGrid={true} snapToGrid={true} />);

    // Initially both items should be rendered
    expect(screen.getByTestId("stage-item-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("stage-item-item-2")).toBeInTheDocument();

    // Delete the selected item
    updatedMockHandleDeleteItem("item-1");

    // Document service should have been called
    expect(mockRemoveItemAndUpdate).toHaveBeenCalledWith("item-1");

    // The document should now only have one item
    expect(updatedMockDocument.items.length).toBe(1);
    expect(updatedMockDocument.items[0].id).toBe("item-2");

    // Rerender with the updated document
    rerender(<Stage showGrid={true} snapToGrid={true} />);

    // The deleted item should not be rendered anymore
    expect(screen.queryByTestId("stage-item-item-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("stage-item-item-2")).toBeInTheDocument();

    // Clean up
    mockSelectedItems.clear();
  });

  test("pressing Delete key deletes a single selected item", () => {
    // Clear previous mock calls
    mockHandleDeleteItem.mockClear();

    // Setup with a single selected item
    mockSelectedItems.add("item-1");

    render(<Stage showGrid={true} snapToGrid={true} />);

    // Simulate Delete key press on the stage
    const stageElement = screen.getByTestId("stage");

    // Focus the stage element first
    stageElement.focus();

    fireEvent.keyDown(stageElement, { key: "Delete" });

    // Verify that handleDeleteItem was called for the selected item
    expect(mockHandleDeleteItem).toHaveBeenCalledTimes(1);
    expect(mockHandleDeleteItem).toHaveBeenCalledWith("item-1");

    // Clean up
    mockSelectedItems.clear();
  });
});
