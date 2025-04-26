import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClipboardService } from "../clipboardService";
import { StageItem } from "../../types/document";
import type { ClipboardAction } from "../../context/ClipboardContext";

describe("clipboardService", () => {
  let dispatch: (action: ClipboardAction) => void;
  let getClipboardItem: () => StageItem | null;
  let clipboardService: ReturnType<typeof createClipboardService>;

  const testItem: StageItem = {
    id: "1",
    name: "Chair",
    category: "equipment",
    icon: "chair-icon",
    position: { x: 10, y: 20 },
    width: 40,
    height: 40,
  };

  const testItems: StageItem[] = [
    testItem,
    {
      id: "2",
      name: "Table",
      category: "equipment",
      icon: "table-icon",
      position: { x: 100, y: 150 },
      width: 60,
      height: 120,
    },
  ];

  beforeEach(() => {
    dispatch = vi.fn();
    getClipboardItem = vi.fn();
    clipboardService = createClipboardService(dispatch, getClipboardItem);
  });

  describe("copyItem", () => {
    it("should dispatch COPY_ITEM action with the item", () => {
      clipboardService.copyItem(testItem);

      expect(dispatch).toHaveBeenCalledWith({
        type: "COPY_ITEM",
        item: testItem,
      });
    });
  });

  describe("copyItems", () => {
    it("should dispatch COPY_ITEMS action with the items", () => {
      clipboardService.copyItems(testItems);

      expect(dispatch).toHaveBeenCalledWith({
        type: "COPY_ITEMS",
        items: testItems,
      });
    });
  });

  describe("cutItem", () => {
    it("should copy the item and call delete callback", () => {
      const deleteCallback = vi.fn();

      clipboardService.cutItem(testItem, deleteCallback);

      expect(dispatch).toHaveBeenCalledWith({
        type: "COPY_ITEM",
        item: testItem,
      });
      expect(deleteCallback).toHaveBeenCalledWith(testItem.id);
    });
  });

  describe("cutItems", () => {
    it("should copy the items and call delete callback for each item", () => {
      const deleteCallback = vi.fn();

      clipboardService.cutItems(testItems, deleteCallback);

      expect(dispatch).toHaveBeenCalledWith({
        type: "COPY_ITEMS",
        items: testItems,
      });
      expect(deleteCallback).toHaveBeenCalledTimes(2);
      expect(deleteCallback).toHaveBeenCalledWith(testItems[0].id);
      expect(deleteCallback).toHaveBeenCalledWith(testItems[1].id);
    });

    it("should not do anything if items array is empty", () => {
      const deleteCallback = vi.fn();

      clipboardService.cutItems([], deleteCallback);

      expect(dispatch).not.toHaveBeenCalled();
      expect(deleteCallback).not.toHaveBeenCalled();
    });
  });

  describe("hasClipboardItem", () => {
    it("should return true when clipboard has an item", () => {
      vi.mocked(getClipboardItem).mockReturnValue(testItem);

      expect(clipboardService.hasClipboardItem()).toBe(true);
    });

    it("should return false when clipboard is empty", () => {
      vi.mocked(getClipboardItem).mockReturnValue(null);

      expect(clipboardService.hasClipboardItem()).toBe(false);
    });
  });

  describe("clearClipboard", () => {
    it("should dispatch CLEAR_CLIPBOARD action", () => {
      clipboardService.clearClipboard();

      expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_CLIPBOARD" });
    });
  });
});
