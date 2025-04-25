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
  const mockClipboardFunctions = {
    clipboardItem: null,
    hasClipboardItem: mockHasClipboardItem,
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
});
