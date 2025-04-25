import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppLayout } from "../AppLayout";

// Mock the child components
vi.mock("../controls/ResizeHandle", () => ({
  ResizeHandle: ({
    onResizeStart,
    title,
  }: {
    onResizeStart: (e: React.MouseEvent) => void;
    title?: string;
    isDragging?: boolean;
  }) => (
    <div
      data-testid="resize-handle-mock"
      onClick={onResizeStart}
      title={title}
    />
  ),
}));

vi.mock("../controls/PanelToggle", () => ({
  PanelToggle: ({
    onToggle,
    title,
    isOpen,
  }: {
    onToggle: () => void;
    title?: string;
    isOpen: boolean;
  }) => (
    <div
      data-testid="panel-toggle-mock"
      onClick={onToggle}
      title={title}
      data-is-open={isOpen}
    />
  ),
}));

describe("AppLayout", () => {
  const defaultProps = {
    header: <div data-testid="header">Header Content</div>,
    sidebar: <div data-testid="sidebar">Sidebar Content</div>,
    main: <div data-testid="main">Main Content</div>,
    sidePanel: <div data-testid="side-panel">Side Panel Content</div>,
  };

  it("renders all layout regions", () => {
    render(<AppLayout {...defaultProps} />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("main")).toBeInTheDocument();
    expect(screen.getByTestId("side-panel")).toBeInTheDocument();
  });

  it("renders resize handles", () => {
    render(<AppLayout {...defaultProps} />);

    // We should have two resize handles (sidebar and side panel)
    const resizeHandles = screen.getAllByTestId("resize-handle-mock");
    expect(resizeHandles.length).toBe(2);
  });

  it("renders panel toggle", () => {
    render(<AppLayout {...defaultProps} />);

    const panelToggle = screen.getByTestId("panel-toggle-mock");
    expect(panelToggle).toBeInTheDocument();
  });

  it("toggles side panel when panel toggle is clicked", () => {
    render(<AppLayout {...defaultProps} />);

    const panelToggle = screen.getByTestId("panel-toggle-mock");

    // Initially the panel should be closed
    expect(panelToggle.getAttribute("data-is-open")).toBe("false");

    // Click to open
    fireEvent.click(panelToggle);
    expect(panelToggle.getAttribute("data-is-open")).toBe("true");

    // Click to close
    fireEvent.click(panelToggle);
    expect(panelToggle.getAttribute("data-is-open")).toBe("false");
  });

  // Note: Testing resize functionality would typically involve more complex
  // mouse event simulation which we'll skip for this basic test suite
});
