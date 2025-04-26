import { useMemo } from "react";
import { StageItem } from "../types/document";
import { useClipboard } from "../context/ClipboardContext";
import { ClipboardAction } from "../context/ClipboardContext";

// Define the service type
export interface ClipboardService {
  copyItem: (item: StageItem) => void;
  copyItems: (items: StageItem[]) => void;
  cutItem: (item: StageItem, deleteCallback: (id: string) => void) => void;
  cutItems: (items: StageItem[], deleteCallback: (id: string) => void) => void;
  hasClipboardItem: () => boolean;
  clearClipboard: () => void;
}

// Factory function to create a clipboard service
export function createClipboardService(
  dispatch: React.Dispatch<ClipboardAction>,
  getClipboardItem: () => StageItem | null
): ClipboardService {
  return {
    copyItem: (item) => {
      dispatch({ type: "COPY_ITEM", item });
    },

    copyItems: (items) => {
      dispatch({ type: "COPY_ITEMS", items });
    },

    cutItem: (item, deleteCallback) => {
      dispatch({ type: "COPY_ITEM", item });
      deleteCallback(item.id);
    },

    cutItems: (items, deleteCallback) => {
      if (items.length === 0) return;
      dispatch({ type: "COPY_ITEMS", items });
      items.forEach((item) => {
        deleteCallback(item.id);
      });
    },

    hasClipboardItem: () => {
      return getClipboardItem() !== null;
    },

    clearClipboard: () => {
      dispatch({ type: "CLEAR_CLIPBOARD" });
    },
  };
}

// Custom hook to use the clipboard service
export function useClipboardService() {
  const { dispatch, clipboardItem, clipboardItems } = useClipboard();

  // Memoize the service so it's stable across renders
  const clipboardService = useMemo(
    () => createClipboardService(dispatch, () => clipboardItem),
    [dispatch, clipboardItem]
  );

  return { clipboardService, clipboardItem, clipboardItems };
}
