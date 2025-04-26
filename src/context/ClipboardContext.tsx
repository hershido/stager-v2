import { createContext, useContext, useReducer, ReactNode } from "react";
import { StageItem } from "../types/document";

// Define action types for the clipboard reducer
export type ClipboardAction =
  | { type: "COPY_ITEM"; item: StageItem }
  | { type: "COPY_ITEMS"; items: StageItem[] }
  | { type: "CLEAR_CLIPBOARD" };

// Define state type
export interface ClipboardState {
  clipboardItem: StageItem | null;
  clipboardItems: StageItem[];
}

// Context type
interface ClipboardContextType {
  clipboardItem: StageItem | null;
  clipboardItems: StageItem[];
  dispatch: React.Dispatch<ClipboardAction>;
}

// Create the context with default values
const ClipboardContext = createContext<ClipboardContextType | undefined>(
  undefined
);

// Clipboard reducer function
function clipboardReducer(
  state: ClipboardState,
  action: ClipboardAction
): ClipboardState {
  switch (action.type) {
    case "COPY_ITEM":
      return {
        clipboardItem: { ...action.item },
        clipboardItems: [{ ...action.item }],
      };
    case "COPY_ITEMS":
      if (action.items.length === 0) return state;
      return {
        clipboardItem: { ...action.items[0] }, // For backward compatibility
        clipboardItems: action.items.map((item) => ({ ...item })),
      };
    case "CLEAR_CLIPBOARD":
      return {
        clipboardItem: null,
        clipboardItems: [],
      };
    default:
      return state;
  }
}

// Initial state
const initialClipboardState: ClipboardState = {
  clipboardItem: null,
  clipboardItems: [],
};

// Provider component
export function ClipboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(clipboardReducer, initialClipboardState);

  const contextValue = {
    clipboardItem: state.clipboardItem,
    clipboardItems: state.clipboardItems,
    dispatch,
  };

  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
    </ClipboardContext.Provider>
  );
}

// Custom hook to use the clipboard context
export function useClipboard() {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error("useClipboard must be used within a ClipboardProvider");
  }
  return context;
}
