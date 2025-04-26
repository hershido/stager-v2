import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AppLayout } from "../AppLayout";
import React from "react";

// Mock the imports to avoid style-related issues
vi.mock("../AppLayout.module.scss", () => ({
  default: {
    appLayout: "appLayout",
    headerContainer: "headerContainer",
    workspaceContainer: "workspaceContainer",
    sidebarContainer: "sidebarContainer",
    sidebarContent: "sidebarContent",
    mainContainer: "mainContainer",
    sidePanelContainer: "sidePanelContainer",
    sidePanelContent: "sidePanelContent",
    open: "open",
    transitioning: "transitioning",
  },
}));

// Mock the child components for more control
vi.mock("../controls/ResizeHandle", () => ({
  ResizeHandle: ({
    onResizeStart,
    title,
    isDragging,
  }: {
    onResizeStart: (e: React.MouseEvent) => void;
    title?: string;
    isDragging?: boolean;
  }) => (
    <div
      data-testid="resize-handle"
      title={title}
      onMouseDown={onResizeStart}
      data-dragging={isDragging}
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
      data-testid="panel-toggle"
      title={title}
      onClick={onToggle}
      data-is-open={isOpen}
    />
  ),
}));

describe("AppLayout", () => {
  const mockHeader = <div data-testid="header">Header Content</div>;
  const mockSidebar = <div data-testid="sidebar">Sidebar Content</div>;
  const mockMain = <div data-testid="main">Main Content</div>;
  const mockSidePanel = <div data-testid="sidePanel">Side Panel Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render all sections correctly", () => {
    render(
      <AppLayout
        header={mockHeader}
        sidebar={mockSidebar}
        main={mockMain}
        sidePanel={mockSidePanel}
      />
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("main")).toBeInTheDocument();
    expect(screen.getByTestId("sidePanel")).toBeInTheDocument();
  });

  it("should have resize handles for sidebar and side panel", () => {
    render(
      <AppLayout
        header={mockHeader}
        sidebar={mockSidebar}
        main={mockMain}
        sidePanel={mockSidePanel}
      />
    );

    const resizeHandles = screen.getAllByTestId("resize-handle");
    expect(resizeHandles).toHaveLength(2);
    expect(resizeHandles[0]).toHaveAttribute("title", "Resize sidebar");
    expect(resizeHandles[1]).toHaveAttribute("title", "Resize panel");
  });

  it("should have panel toggle with correct initial state", () => {
    render(
      <AppLayout
        header={mockHeader}
        sidebar={mockSidebar}
        main={mockMain}
        sidePanel={mockSidePanel}
      />
    );

    const panelToggle = screen.getByTestId("panel-toggle");
    expect(panelToggle).toHaveAttribute("title", "Open panel");
    expect(panelToggle).toHaveAttribute("data-is-open", "false");
  });

  it("should toggle panel when toggle button is clicked", () => {
    render(
      <AppLayout
        header={mockHeader}
        sidebar={mockSidebar}
        main={mockMain}
        sidePanel={mockSidePanel}
      />
    );

    const panelToggle = screen.getByTestId("panel-toggle");

    // Initial state
    expect(panelToggle).toHaveAttribute("data-is-open", "false");

    // Click to open
    act(() => {
      fireEvent.click(panelToggle);
    });

    expect(panelToggle).toHaveAttribute("data-is-open", "true");

    // Wait for transition to end
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Click to close
    act(() => {
      fireEvent.click(panelToggle);
    });

    expect(panelToggle).toHaveAttribute("data-is-open", "false");
  });

  it("should handle sidebar resize", () => {
    render(
      <AppLayout
        header={mockHeader}
        sidebar={mockSidebar}
        main={mockMain}
        sidePanel={mockSidePanel}
      />
    );

    // Start resize
    const sidebarResizeHandle = screen.getAllByTestId("resize-handle")[0];

    act(() => {
      fireEvent.mouseDown(sidebarResizeHandle, { clientX: 300 });
    });

    // Create a MouseEvent for the mousemove
    act(() => {
      const moveEvent = new MouseEvent("mousemove", { clientX: 350 });
      window.dispatchEvent(moveEvent);
    });

    // Create a MouseEvent for the mouseup
    act(() => {
      const upEvent = new MouseEvent("mouseup");
      window.dispatchEvent(upEvent);
    });
  });
});
