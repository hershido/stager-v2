import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResizeHandle } from "../ResizeHandle";

describe("ResizeHandle", () => {
  it("renders correctly", () => {
    const handleResizeStart = vi.fn();
    render(
      <ResizeHandle
        isDragging={false}
        onResizeStart={handleResizeStart}
        title="Test resize handle"
      />
    );

    // Find the resize handle by its title
    const handle = screen.getByTitle("Test resize handle");
    expect(handle).toBeInTheDocument();
  });

  it("applies dragging class when isDragging is true", () => {
    const handleResizeStart = vi.fn();
    render(
      <ResizeHandle
        isDragging={true}
        onResizeStart={handleResizeStart}
        title="Test resize handle"
      />
    );

    const handle = screen.getByTitle("Test resize handle");
    // Using a partial match for the class since CSS modules transform class names
    expect(handle.className).toContain("dragging");
  });

  it("calls onResizeStart handler when mousedown event occurs", () => {
    const handleResizeStart = vi.fn();
    render(
      <ResizeHandle
        isDragging={false}
        onResizeStart={handleResizeStart}
        title="Test resize handle"
      />
    );

    const handle = screen.getByTitle("Test resize handle");
    fireEvent.mouseDown(handle);

    expect(handleResizeStart).toHaveBeenCalledTimes(1);
  });
});
