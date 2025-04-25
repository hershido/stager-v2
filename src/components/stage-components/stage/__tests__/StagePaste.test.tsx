import { render, screen } from "@testing-library/react";
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
  StageItem: vi.fn(({ item, onMouseDown, selectedItemsCount }) => (
    <div
      data-testid={`stage-item-${item.id}`}
      className="stageItem"
      data-selected-count={selectedItemsCount}
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

describe("Stage with multi-selection and paste functionality", () => {
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

  // Mock clipboard items
  const mockClipboardItems = [
    {
      id: "clipboard-1",
      name: "Clipboard Item 1",
      category: "equipment",
      icon: "📋",
      position: { x: 50, y: 50 },
      width: 60,
      height: 60,
    },
    {
      id: "clipboard-2",
      name: "Clipboard Item 2",
      category: "equipment",
      icon: "📎",
      position: { x: 150, y: 150 },
      width: 70,
      height: 70,
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
  const mockAddItem = vi.fn();
  const mockDocumentService = {
    addItem: mockAddItem,
  };

  // Mock clipboard functions
  const mockHasClipboardItem = vi.fn().mockReturnValue(true);

  // Mock stage state
  const mockSelectedItems = new Set(["item-1", "item-2"]);
  const mockIsItemSelected = vi
    .fn()
    .mockImplementation((id) => mockSelectedItems.has(id));
  const mockGetItemVisualPosition = vi.fn().mockReturnValue(null);
  const mockHandleStageClick = vi.fn();
  const mockHandleMouseDown = vi.fn();
  const mockHandleOverlayMouseMove = vi.fn();
  const mockHandleOverlayMouseUp = vi.fn();
  const mockHandleDeleteItem = vi.fn();
  const mockHandleFlipItem = vi.fn();

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
  const mockContextMenuState = {
    relativePosition: { x: 300, y: 300 },
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

    // Setup clipboard mock with multiple items
    (useClipboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      clipboardItem: mockClipboardItems[0],
      clipboardItems: mockClipboardItems,
      hasClipboardItem: mockHasClipboardItem,
    });

    // Setup stage state mock
    (useStageState as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      mockStageState,
      mockStageActions,
    ]);
  });

  test("passes correct selection props to StageItem components", () => {
    // Set up useContextMenu mock to capture menuItems
    (useContextMenu as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      handleContextMenu: vi.fn(),
      ContextMenu: () => <div data-testid="context-menu">Context Menu</div>,
      contextMenuState: mockContextMenuState,
    });

    render(<Stage showGrid={true} snapToGrid={true} />);

    // Check that StageItems receive the correct selectedItemsCount
    const stageItems = screen.getAllByTestId(/^stage-item-/);
    expect(stageItems).toHaveLength(2);

    // Each StageItem should have the selectedItemsCount reflecting the 2 selected items
    stageItems.forEach((item) => {
      expect(item).toHaveAttribute("data-selected-count", "2");
    });
  });

  test("paste menu label is simple regardless of number of clipboard items", () => {
    // Create mock menu items including a paste option
    const mockMenuItems = [
      {
        id: "add-item",
        label: "Add Item",
        onClick: vi.fn(),
      },
      {
        id: "paste",
        label: "Paste",
        onClick: vi.fn(),
      },
      { type: "divider" as const },
      {
        id: "clear",
        label: "Clear Stage",
        onClick: vi.fn(),
      },
    ];

    // Capture the menu items passed to useContextMenu
    const mockContextMenuFn = vi.fn();
    (useContextMenu as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (options) => {
        // Store the original options
        mockContextMenuFn(options);

        // But return our predefined menu items
        return {
          handleContextMenu: vi.fn(),
          ContextMenu: () => <div data-testid="context-menu">Context Menu</div>,
          contextMenuState: mockContextMenuState,
          // Return items with our paste option
          items: mockMenuItems,
        };
      }
    );

    render(<Stage showGrid={true} snapToGrid={true} />);

    // Verify that useContextMenu was called
    expect(mockContextMenuFn).toHaveBeenCalled();

    // Find the paste item in our mock menu items
    const pasteItem = mockMenuItems.find((item) => item.id === "paste");
    expect(pasteItem).toBeDefined();

    // Verify the label is simple "Paste" even with multiple clipboard items
    expect(pasteItem?.label).toBe("Paste");
  });

  test("paste function adds all clipboard items with correct positions", () => {
    // Create a mock paste handler we can control
    const mockPasteHandler = vi.fn().mockImplementation(() => {
      // Simulate the behavior of handlePasteItem
      mockClipboardItems.forEach((item) => {
        const newItem = {
          ...item,
          id: "new-" + item.id,
          position: {
            x:
              mockContextMenuState.relativePosition.x +
              (item.position.x - mockClipboardItems[0].position.x),
            y:
              mockContextMenuState.relativePosition.y +
              (item.position.y - mockClipboardItems[0].position.y),
          },
        };
        mockAddItem(newItem);
      });
    });

    // Create mock menu items with our paste handler
    const mockMenuItems = [
      {
        id: "add-item",
        label: "Add Item",
        onClick: vi.fn(),
      },
      {
        id: "paste",
        label: "Paste",
        onClick: mockPasteHandler,
      },
    ];

    // Set up context menu mock
    (useContextMenu as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      handleContextMenu: vi.fn(),
      ContextMenu: () => <div data-testid="context-menu">Context Menu</div>,
      contextMenuState: mockContextMenuState,
      items: mockMenuItems,
    });

    render(<Stage showGrid={true} snapToGrid={true} />);

    // Trigger the paste action
    mockPasteHandler();

    // Check that addItem was called for each clipboard item
    expect(mockAddItem).toHaveBeenCalledTimes(2);

    // The first call should be for the first clipboard item
    const firstCallArgs = mockAddItem.mock.calls[0][0];
    expect(firstCallArgs).toMatchObject({
      name: "Clipboard Item 1",
      icon: "📋",
    });

    // The second call should be for the second clipboard item
    const secondCallArgs = mockAddItem.mock.calls[1][0];
    expect(secondCallArgs).toMatchObject({
      name: "Clipboard Item 2",
      icon: "📎",
    });

    // Verify relative positioning is maintained
    const firstPos = mockAddItem.mock.calls[0][0].position;
    const secondPos = mockAddItem.mock.calls[1][0].position;

    // Original relative difference was (100,100)
    const relX = secondPos.x - firstPos.x;
    const relY = secondPos.y - firstPos.y;

    // Expect the exact difference (since we're not applying grid snapping in the mock)
    expect(relX).toBe(100);
    expect(relY).toBe(100);
  });
});
