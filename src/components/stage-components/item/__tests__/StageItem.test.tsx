import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { StageItem } from "../StageItem";
import { useContextMenu } from "../../../hooks/useContextMenu";
import { useClipboardService } from "../../../../services/clipboardService";
import { useDocumentService } from "../../../../services/documentService";
import { StageItem as StageItemType } from "../../../../types/document";

// Mock the hooks
vi.mock("../../../hooks/useContextMenu", () => ({
  useContextMenu: vi.fn(),
}));

vi.mock("../../../../services/clipboardService", () => ({
  useClipboardService: vi.fn(),
}));

vi.mock("../../../../services/documentService", () => ({
  useDocumentService: vi.fn(),
}));

// Mock the AlignmentControls component
vi.mock("../../../common/AlignmentControls", () => ({
  AlignmentControls: (props: {
    onAlignLeft: () => void;
    onAlignCenter: () => void;
    onAlignRight: () => void;
    onAlignTop: () => void;
    onAlignMiddle: () => void;
    onAlignBottom: () => void;
    showDistribution?: boolean;
    onDistributeHorizontal?: () => void;
    onDistributeVertical?: () => void;
  }) => (
    <div data-testid="alignment-controls">
      <button data-testid="align-left" onClick={props.onAlignLeft}>
        Align Left
      </button>
      <button data-testid="align-center" onClick={props.onAlignCenter}>
        Align Center
      </button>
      <button data-testid="align-right" onClick={props.onAlignRight}>
        Align Right
      </button>
      <button data-testid="align-top" onClick={props.onAlignTop}>
        Align Top
      </button>
      <button data-testid="align-middle" onClick={props.onAlignMiddle}>
        Align Middle
      </button>
      <button data-testid="align-bottom" onClick={props.onAlignBottom}>
        Align Bottom
      </button>
      {props.showDistribution && (
        <>
          <button
            data-testid="distribute-horizontal"
            onClick={props.onDistributeHorizontal}
          >
            Distribute Horizontal
          </button>
          <button
            data-testid="distribute-vertical"
            onClick={props.onDistributeVertical}
          >
            Distribute Vertical
          </button>
        </>
      )}
    </div>
  ),
}));

// Mock the CSS module
vi.mock("../StageItem.module.scss", () => ({
  default: {
    stageItem: "stageItem",
    selected: "selected",
    itemContent: "itemContent",
    itemIcon: "itemIcon",
    itemName: "itemName",
    contextMenuHeader: "contextMenuHeader",
    headerIcon: "headerIcon",
    headerName: "headerName",
    shortcutIcon: "shortcutIcon",
  },
}));

describe("StageItem", () => {
  // Mock item
  const mockItem: StageItemType = {
    id: "item-1",
    name: "Test Item",
    category: "equipment",
    icon: "🎸",
    position: { x: 100, y: 200 },
    width: 120,
    height: 80,
  };

  // Second mock item for multi-selection tests
  const mockItem2: StageItemType = {
    id: "item-2",
    name: "Test Item 2",
    category: "equipment",
    icon: "🎹",
    position: { x: 300, y: 400 },
    width: 100,
    height: 100,
  };

  // Mock handlers
  const mockOnMouseDown = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnFlip = vi.fn();

  // Mock document service
  const mockUpdateItem = vi.fn();
  const mockDocument = {
    stage: {
      width: 1000,
      height: 800,
    },
  };

  // Mock clipboard functions
  const mockCopyItem = vi.fn();
  const mockCutItem = vi.fn();
  const mockCopyItems = vi.fn((items) => items);
  const mockCutItems = vi.fn((items) => items);

  // Mock getSelectedItems function
  const mockGetSelectedItems = vi.fn().mockReturnValue([mockItem, mockItem2]);

  // Mock context menu
  const mockHandleContextMenu = vi.fn();
  const MockItemContextMenu = () => <div data-testid="context-menu"></div>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup document service mock
    (useDocumentService as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      {
        document: mockDocument,
        documentService: {
          updateItem: mockUpdateItem,
          addItem: vi.fn(),
          removeItem: vi.fn(),
          updateDocument: vi.fn(),
          updateStage: vi.fn(),
          loadDocument: vi.fn(),
          createNew: vi.fn(),
          getCurrentDocument: vi.fn(),
        },
      }
    );

    // Setup clipboard service mock
    (
      useClipboardService as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      clipboardItem: null,
      clipboardItems: [],
      clipboardService: {
        copyItem: mockCopyItem,
        cutItem: mockCutItem,
        copyItems: mockCopyItems,
        cutItems: mockCutItems,
        hasClipboardItem: vi.fn(),
        clearClipboard: vi.fn(),
      },
    });

    // Setup context menu mock
    (useContextMenu as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      handleContextMenu: mockHandleContextMenu,
      ContextMenu: MockItemContextMenu,
    });
  });

  test("renders with correct position and dimensions", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    const stageItem = screen.getByText("Test Item").closest(".stageItem");
    expect(stageItem).toBeInTheDocument();
    expect(stageItem).toHaveStyle({
      left: "100px",
      top: "200px",
      width: "120px",
      height: "80px",
    });
  });

  test("shows selection state correctly", () => {
    const { rerender } = render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    // Not selected initially
    let stageItem = screen.getByText("Test Item").closest(".stageItem");
    expect(stageItem).not.toHaveClass("selected");

    // Rerender with selected=true
    rerender(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={true}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    // Should now have selected class
    stageItem = screen.getByText("Test Item").closest(".stageItem");
    expect(stageItem).toHaveClass("selected");
  });

  test("renders item content correctly", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    expect(screen.getByText("Test Item")).toBeInTheDocument();
    expect(screen.getByText("🎸")).toBeInTheDocument();
  });

  test("uses dragVisualPosition when dragging", () => {
    const dragPos = { x: 300, y: 400 };

    render(
      <StageItem
        item={mockItem}
        isDragged={true}
        isSelected={false}
        dragVisualPosition={dragPos}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    const stageItem = screen.getByText("Test Item").closest(".stageItem");
    expect(stageItem).toHaveStyle({
      left: "300px",
      top: "400px",
    });
  });

  test("calls onMouseDown when mouse down on item", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    const stageItem = screen.getByText("Test Item").closest(".stageItem");
    fireEvent.mouseDown(stageItem!);

    expect(mockOnMouseDown).toHaveBeenCalledTimes(1);
    expect(mockOnMouseDown).toHaveBeenCalledWith(expect.anything(), "item-1");
  });

  test("applies flipped transform when item is flipped", () => {
    const flippedItem = {
      ...mockItem,
      isFlipped: true,
    };

    render(
      <StageItem
        item={flippedItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    const stageItem = screen.getByText("Test Item").closest(".stageItem");
    expect(stageItem).toHaveStyle({
      transform: "scaleX(-1)",
    });
  });

  test("renders context menu", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });

  test("calls handleContextMenu on right click", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    const stageItem = screen.getByText("Test Item").closest(".stageItem");
    fireEvent.contextMenu(stageItem!);

    expect(mockHandleContextMenu).toHaveBeenCalledTimes(1);
  });

  test("creates context menu with correct items", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={false}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
      />
    );

    // Check that useContextMenu was called with the correct menu items
    expect(useContextMenu).toHaveBeenCalledTimes(1);
    const contextMenuCall = (
      useContextMenu as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];

    // Verify menu items - we expect 8 items now: copy, cut, duplicate, divider, alignment, divider, flip, delete
    const menuItems = contextMenuCall.items;
    expect(menuItems).toHaveLength(8);
    expect(menuItems[0].id).toBe("copy");
    expect(menuItems[0].label).toBe("Copy");
    expect(menuItems[1].id).toBe("cut");
    expect(menuItems[1].label).toBe("Cut");
    expect(menuItems[2].id).toBe("duplicate");
    expect(menuItems[2].label).toBe("Duplicate");
    expect(menuItems[3].type).toBe("divider");
    expect(menuItems[4].id).toBe("alignment");
    expect(menuItems[5].type).toBe("divider");
    expect(menuItems[6].id).toBe("flip");
    expect(menuItems[7].id).toBe("delete");
    expect(menuItems[7].label).toBe("Delete");
  });

  test("creates context menu with correct items for multi-selection", () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={true}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
        selectedItemsCount={2}
        getSelectedItems={mockGetSelectedItems}
      />
    );

    // Check that useContextMenu was called with the correct menu items for multi-selection
    expect(useContextMenu).toHaveBeenCalledTimes(1);
    const contextMenuCall = (
      useContextMenu as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];

    // Verify menu items - we expect 8 items now: copy, cut, duplicate, divider, alignment, divider, flip, delete
    const menuItems = contextMenuCall.items;
    expect(menuItems).toHaveLength(8);

    // Check that the labels are the same as in single selection
    expect(menuItems[0].id).toBe("copy");
    expect(menuItems[0].label).toBe("Copy");
    expect(menuItems[1].id).toBe("cut");
    expect(menuItems[1].label).toBe("Cut");
    expect(menuItems[2].id).toBe("duplicate");
    expect(menuItems[4].id).toBe("alignment");
    expect(menuItems[6].id).toBe("flip");
    expect(menuItems[6].label).toBe("Flip");
    expect(menuItems[7].id).toBe("delete");
    expect(menuItems[7].label).toBe("Delete");

    // Check that the header correctly shows multi-selection
    const header = contextMenuCall.header;
    expect(header.props.children[0].props.children).toBe("📑");
    expect(header.props.children[1].props.children).toBe("2 Items Selected");
  });

  test("menu actions handle multiple items when multi-selected", async () => {
    // Explicitly mock getSelectedItems to return an array that we can verify
    const items = [mockItem, mockItem2];
    const getSelectedItemsMock = vi.fn().mockReturnValue(items);

    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={true}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
        selectedItemsCount={2}
        getSelectedItems={getSelectedItemsMock}
      />
    );

    // Get the context menu handler calls
    const contextMenuCall = (
      useContextMenu as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    const menuItems = contextMenuCall.items;

    // Trigger Copy action
    menuItems[0].onClick();
    expect(getSelectedItemsMock).toHaveBeenCalledTimes(1);
    expect(mockCopyItems).toHaveBeenCalledTimes(1);
    expect(mockCopyItems).toHaveBeenCalledWith(items);

    // Trigger Cut action
    menuItems[1].onClick();
    expect(getSelectedItemsMock).toHaveBeenCalledTimes(2);
    expect(mockCutItems).toHaveBeenCalledTimes(1);
    expect(mockCutItems).toHaveBeenCalledWith(items, mockOnDelete);

    // Trigger Flip action (now at index 6)
    menuItems[6].onClick();
    expect(getSelectedItemsMock).toHaveBeenCalledTimes(3);
    expect(mockOnFlip).toHaveBeenCalledTimes(2);
    expect(mockOnFlip).toHaveBeenNthCalledWith(1, "item-1");
    expect(mockOnFlip).toHaveBeenNthCalledWith(2, "item-2");

    // Trigger Delete action (now at index 7)
    menuItems[7].onClick();
    expect(getSelectedItemsMock).toHaveBeenCalledTimes(4);
    expect(mockOnDelete).toHaveBeenCalledTimes(2);
    expect(mockOnDelete).toHaveBeenNthCalledWith(1, "item-1");
    expect(mockOnDelete).toHaveBeenNthCalledWith(2, "item-2");
  });

  test("menu actions handle single item when not multi-selected", async () => {
    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={true}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
        selectedItemsCount={1}
        getSelectedItems={mockGetSelectedItems}
      />
    );

    // Get the context menu handler calls
    const contextMenuCall = (
      useContextMenu as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    const menuItems = contextMenuCall.items;

    // Trigger Copy action
    menuItems[0].onClick();
    expect(mockCopyItem).toHaveBeenCalledTimes(1);
    expect(mockCopyItem).toHaveBeenCalledWith(mockItem);

    // Trigger Cut action
    menuItems[1].onClick();
    expect(mockCutItem).toHaveBeenCalledTimes(1);
    expect(mockCutItem).toHaveBeenCalledWith(mockItem, mockOnDelete);

    // Trigger Flip action (now at index 6)
    menuItems[6].onClick();
    expect(mockOnFlip).toHaveBeenCalledTimes(1);
    expect(mockOnFlip).toHaveBeenCalledWith("item-1");

    // Trigger Delete action (now at index 7)
    menuItems[7].onClick();
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith("item-1");
  });

  test("alignment functions call updateItem with correct parameters", () => {
    // Mock for getSelectedItems
    const items = [mockItem, mockItem2];
    const getSelectedItemsMock = vi.fn().mockReturnValue(items);

    render(
      <StageItem
        item={mockItem}
        isDragged={false}
        isSelected={true}
        dragVisualPosition={null}
        onMouseDown={mockOnMouseDown}
        onDelete={mockOnDelete}
        onFlip={mockOnFlip}
        selectedItemsCount={2}
        getSelectedItems={getSelectedItemsMock}
      />
    );

    // Get the alignment controls from the context menu
    const contextMenuCall = (
      useContextMenu as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];

    // Get the alignment content component
    const alignmentMenuItem = contextMenuCall.items[4];
    expect(alignmentMenuItem.id).toBe("alignment");

    // The content property contains the AlignmentControls component
    expect(alignmentMenuItem.content).toBeDefined();

    // Extract the alignment functions from the passed props
    const alignmentProps = alignmentMenuItem.content.props;

    // Call the align left function and verify it aligns to the leftmost item
    // Reset mock between calls to make assertions clearer
    mockUpdateItem.mockReset();
    alignmentProps.onAlignLeft();
    expect(getSelectedItemsMock).toHaveBeenCalled();
    // We expect both items to be updated with x: 100 (the leftmost x position)
    expect(mockUpdateItem).toHaveBeenCalledTimes(2);
    expect(mockUpdateItem).toHaveBeenNthCalledWith(1, "item-1", {
      position: { ...mockItem.position, x: 100 },
    });
    expect(mockUpdateItem).toHaveBeenNthCalledWith(2, "item-2", {
      position: { ...mockItem2.position, x: 100 },
    });

    // Test align top (uses the topmost y position)
    mockUpdateItem.mockReset();
    alignmentProps.onAlignTop();
    expect(getSelectedItemsMock).toHaveBeenCalled();
    // We expect both items to be updated with y: 200 (the topmost y position)
    expect(mockUpdateItem).toHaveBeenCalledTimes(2);
    expect(mockUpdateItem).toHaveBeenNthCalledWith(1, "item-1", {
      position: { ...mockItem.position, y: 200 },
    });
    expect(mockUpdateItem).toHaveBeenNthCalledWith(2, "item-2", {
      position: { ...mockItem2.position, y: 200 },
    });
  });
});
