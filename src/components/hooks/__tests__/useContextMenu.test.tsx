import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useContextMenu } from "../useContextMenu";
import React from "react";

describe("useContextMenu", () => {
  const mockItems = [
    { id: "item1", label: "Item 1", onClick: vi.fn() },
    { id: "item2", label: "Item 2", onClick: vi.fn() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useContextMenu({ items: mockItems }));

    expect(result.current.contextMenuState).toEqual({
      show: false,
      position: { x: 0, y: 0 },
    });
  });

  it("should show context menu on handleContextMenu call", () => {
    const { result } = renderHook(() => useContextMenu({ items: mockItems }));

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200,
      currentTarget: document.createElement("div"),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleContextMenu(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.contextMenuState).toEqual({
      show: true,
      position: { x: 100, y: 200 },
    });
  });

  it("should compute relative position when computeRelativePosition is provided", () => {
    const mockComputeRelativePosition = vi
      .fn()
      .mockReturnValue({ x: 50, y: 60 });

    const { result } = renderHook(() =>
      useContextMenu({
        items: mockItems,
        computeRelativePosition: mockComputeRelativePosition,
      })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200,
      currentTarget: document.createElement("div"),
      target: document.createElement("div"),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleContextMenu(mockEvent);
    });

    expect(mockComputeRelativePosition).toHaveBeenCalledWith(
      mockEvent,
      mockEvent.currentTarget
    );

    expect(result.current.contextMenuState).toEqual({
      show: true,
      position: { x: 100, y: 200 },
      relativePosition: { x: 50, y: 60 },
    });
  });

  it("should not show context menu when element is filtered out", () => {
    const mockElementFilter = vi.fn().mockReturnValue(true); // Return true to filter out

    const { result } = renderHook(() =>
      useContextMenu({
        items: mockItems,
        onElementFilter: mockElementFilter,
      })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200,
      currentTarget: document.createElement("div"),
      target: document.createElement("div"),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleContextMenu(mockEvent);
    });

    expect(mockElementFilter).toHaveBeenCalledWith(mockEvent.target);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(result.current.contextMenuState.show).toBe(false);
  });

  it("should render null when context menu is not shown", () => {
    const { result } = renderHook(() => useContextMenu({ items: mockItems }));

    const ContextMenu = result.current.ContextMenu;
    expect(ContextMenu()).toBeNull();
  });

  // Testing ContextMenu component rendering would require a more integrated test
  // with actual DOM rendering, but this gives us good coverage of the hook's logic
});
