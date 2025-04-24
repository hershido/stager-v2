import { createContext, useContext, useState, ReactNode } from "react";
import { StageItem } from "../types/document";

interface ClipboardContextType {
  clipboardItem: StageItem | null;
  copyItem: (item: StageItem) => void;
  cutItem: (item: StageItem, deleteCallback: (id: string) => void) => void;
  hasClipboardItem: () => boolean;
  clearClipboard: () => void;
}

const ClipboardContext = createContext<ClipboardContextType>({
  clipboardItem: null,
  copyItem: () => {
    console.warn("ClipboardProvider not found - using default copyItem");
  },
  cutItem: () => {
    console.warn("ClipboardProvider not found - using default cutItem");
  },
  hasClipboardItem: () => false,
  clearClipboard: () => {},
});

export function ClipboardProvider({ children }: { children: ReactNode }) {
  const [clipboardItem, setClipboardItem] = useState<StageItem | null>(null);

  const copyItem = (item: StageItem) => {
    setClipboardItem({ ...item });
  };

  const cutItem = (item: StageItem, deleteCallback: (id: string) => void) => {
    // First store the item in clipboard
    setClipboardItem({ ...item });
    // Then immediately delete the original item
    deleteCallback(item.id);
  };

  const hasClipboardItem = () => clipboardItem !== null;

  const clearClipboard = () => {
    setClipboardItem(null);
  };

  const value = {
    clipboardItem,
    copyItem,
    cutItem,
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
