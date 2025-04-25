import { createContext, useContext, useState, ReactNode } from "react";
import { StageItem } from "../types/document";

interface ClipboardContextType {
  clipboardItem: StageItem | null;
  clipboardItems: StageItem[];
  copyItem: (item: StageItem) => void;
  copyItems: (items: StageItem[]) => void;
  cutItem: (item: StageItem, deleteCallback: (id: string) => void) => void;
  cutItems: (items: StageItem[], deleteCallback: (id: string) => void) => void;
  hasClipboardItem: () => boolean;
  clearClipboard: () => void;
}

const ClipboardContext = createContext<ClipboardContextType>({
  clipboardItem: null,
  clipboardItems: [],
  copyItem: () => {
    console.warn("ClipboardProvider not found - using default copyItem");
  },
  copyItems: () => {
    console.warn("ClipboardProvider not found - using default copyItems");
  },
  cutItem: () => {
    console.warn("ClipboardProvider not found - using default cutItem");
  },
  cutItems: () => {
    console.warn("ClipboardProvider not found - using default cutItems");
  },
  hasClipboardItem: () => false,
  clearClipboard: () => {},
});

export function ClipboardProvider({ children }: { children: ReactNode }) {
  const [clipboardItem, setClipboardItem] = useState<StageItem | null>(null);
  const [clipboardItems, setClipboardItems] = useState<StageItem[]>([]);

  const copyItem = (item: StageItem) => {
    setClipboardItem({ ...item });
    setClipboardItems([{ ...item }]);
  };

  const copyItems = (items: StageItem[]) => {
    if (items.length === 0) return;

    // For backward compatibility, also set the single item (first item)
    setClipboardItem({ ...items[0] });
    // Store all items
    setClipboardItems(items.map((item) => ({ ...item })));
  };

  const cutItem = (item: StageItem, deleteCallback: (id: string) => void) => {
    // First store the item in clipboard
    setClipboardItem({ ...item });
    setClipboardItems([{ ...item }]);
    // Then immediately delete the original item
    deleteCallback(item.id);
  };

  const cutItems = (
    items: StageItem[],
    deleteCallback: (id: string) => void
  ) => {
    if (items.length === 0) return;

    // First store the items in clipboard
    setClipboardItem({ ...items[0] });
    setClipboardItems(items.map((item) => ({ ...item })));

    // Then immediately delete the original items
    items.forEach((item) => {
      deleteCallback(item.id);
    });
  };

  const hasClipboardItem = () => clipboardItem !== null;

  const clearClipboard = () => {
    setClipboardItem(null);
    setClipboardItems([]);
  };

  const value = {
    clipboardItem,
    clipboardItems,
    copyItem,
    copyItems,
    cutItem,
    cutItems,
    hasClipboardItem,
    clearClipboard,
  };

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  return useContext(ClipboardContext);
}
