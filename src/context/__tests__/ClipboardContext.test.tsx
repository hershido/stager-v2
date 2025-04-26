import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { ClipboardProvider } from "../ClipboardContext";
import { useClipboardService } from "../../services/clipboardService";
import { StageItem } from "../../types/document";

describe("ClipboardContext", () => {
  // Mock items
  const mockItem1: StageItem = {
    id: "item-1",
    name: "Test Item 1",
    category: "equipment",
    icon: "🎸",
    position: { x: 100, y: 200 },
    width: 120,
    height: 80,
  };

  const mockItem2: StageItem = {
    id: "item-2",
    name: "Test Item 2",
    category: "equipment",
    icon: "🎹",
    position: { x: 300, y: 400 },
    width: 100,
    height: 100,
  };

  const mockDeleteCallback = vi.fn();

  // Test setup helper
  const setupClipboardHook = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClipboardProvider>{children}</ClipboardProvider>
    );
    return renderHook(() => useClipboardService(), { wrapper });
  };

  test("copyItem stores a single item in clipboard", () => {
    const { result } = setupClipboardHook();

    act(() => {
      result.current.clipboardService.copyItem(mockItem1);
    });

    expect(result.current.clipboardItem).toEqual(mockItem1);
    expect(result.current.clipboardItems).toEqual([mockItem1]);
    expect(result.current.clipboardService.hasClipboardItem()).toBe(true);
  });

  test("copyItems stores multiple items in clipboard", () => {
    const { result } = setupClipboardHook();
    const items = [mockItem1, mockItem2];

    act(() => {
      result.current.clipboardService.copyItems(items);
    });

    // clipboardItem should contain the first item for backward compatibility
    expect(result.current.clipboardItem).toEqual(mockItem1);

    // clipboardItems should contain all items
    expect(result.current.clipboardItems).toHaveLength(2);
    expect(result.current.clipboardItems[0]).toEqual(mockItem1);
    expect(result.current.clipboardItems[1]).toEqual(mockItem2);
    expect(result.current.clipboardService.hasClipboardItem()).toBe(true);
  });

  test("cutItem stores a single item and calls delete callback", () => {
    const { result } = setupClipboardHook();

    act(() => {
      result.current.clipboardService.cutItem(mockItem1, mockDeleteCallback);
    });

    expect(result.current.clipboardItem).toEqual(mockItem1);
    expect(result.current.clipboardItems).toEqual([mockItem1]);
    expect(mockDeleteCallback).toHaveBeenCalledTimes(1);
    expect(mockDeleteCallback).toHaveBeenCalledWith(mockItem1.id);
  });

  test("cutItems stores multiple items and calls delete callback for each", () => {
    const { result } = setupClipboardHook();
    const items = [mockItem1, mockItem2];

    act(() => {
      result.current.clipboardService.cutItems(items, mockDeleteCallback);
    });

    // clipboardItem should contain the first item for backward compatibility
    expect(result.current.clipboardItem).toEqual(mockItem1);

    // clipboardItems should contain all items
    expect(result.current.clipboardItems).toHaveLength(2);
    expect(result.current.clipboardItems[0]).toEqual(mockItem1);
    expect(result.current.clipboardItems[1]).toEqual(mockItem2);

    // Delete callback should be called for each item
    expect(mockDeleteCallback).toHaveBeenCalledTimes(2);
    expect(mockDeleteCallback).toHaveBeenNthCalledWith(1, mockItem1.id);
    expect(mockDeleteCallback).toHaveBeenNthCalledWith(2, mockItem2.id);
  });

  test("clearClipboard empties both clipboardItem and clipboardItems", () => {
    const { result } = setupClipboardHook();
    const items = [mockItem1, mockItem2];

    // First add some items
    act(() => {
      result.current.clipboardService.copyItems(items);
    });

    // Verify items are in clipboard
    expect(result.current.clipboardItem).toEqual(mockItem1);
    expect(result.current.clipboardItems).toHaveLength(2);

    // Clear clipboard
    act(() => {
      result.current.clipboardService.clearClipboard();
    });

    // Verify everything is cleared
    expect(result.current.clipboardItem).toBeNull();
    expect(result.current.clipboardItems).toHaveLength(0);
    expect(result.current.clipboardService.hasClipboardItem()).toBe(false);
  });

  test("empty items array in copyItems doesn't change clipboard state", () => {
    const { result } = setupClipboardHook();

    // First add a single item
    act(() => {
      result.current.clipboardService.copyItem(mockItem1);
    });

    // Then try to copy an empty array
    act(() => {
      result.current.clipboardService.copyItems([]);
    });

    // Clipboard should still contain the original item
    expect(result.current.clipboardItem).toEqual(mockItem1);
    expect(result.current.clipboardItems).toEqual([mockItem1]);
  });

  test("empty items array in cutItems doesn't change clipboard state", () => {
    const { result } = setupClipboardHook();

    // First add a single item
    act(() => {
      result.current.clipboardService.copyItem(mockItem1);
    });

    // Then try to cut an empty array
    act(() => {
      result.current.clipboardService.cutItems([], mockDeleteCallback);
    });

    // Clipboard should still contain the original item
    expect(result.current.clipboardItem).toEqual(mockItem1);
    expect(result.current.clipboardItems).toEqual([mockItem1]);

    // Delete callback should not be called
    expect(mockDeleteCallback).not.toHaveBeenCalled();
  });
});
