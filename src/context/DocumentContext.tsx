import { createContext, useContext, useReducer, ReactNode } from "react";
import {
  StagerDocument,
  StageItem,
  createInitialDocument,
} from "../types/document";

// Define action types for the document reducer
type DocumentAction =
  | { type: "UPDATE_DOCUMENT"; updates: Partial<StagerDocument> }
  | { type: "UPDATE_STAGE"; updates: Partial<StagerDocument["stage"]> }
  | { type: "ADD_ITEM"; item: StageItem }
  | { type: "UPDATE_ITEM"; id: string; updates: Partial<StageItem> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "LOAD_DOCUMENT"; document: StagerDocument }
  | { type: "NEW_DOCUMENT" };

// Context type
interface DocumentContextType {
  document: StagerDocument;
  dispatch: React.Dispatch<DocumentAction>;
}

// Create the context
const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

// Document reducer function
function documentReducer(
  state: StagerDocument,
  action: DocumentAction
): StagerDocument {
  switch (action.type) {
    case "UPDATE_DOCUMENT":
      return { ...state, ...action.updates, updatedAt: Date.now() };

    case "UPDATE_STAGE":
      return {
        ...state,
        stage: { ...state.stage, ...action.updates },
        updatedAt: Date.now(),
      };

    case "ADD_ITEM":
      return {
        ...state,
        items: [...state.items, action.item],
        updatedAt: Date.now(),
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
        updatedAt: Date.now(),
      };

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
        updatedAt: Date.now(),
      };

    case "LOAD_DOCUMENT":
      return action.document;

    case "NEW_DOCUMENT":
      return createInitialDocument();

    default:
      return state;
  }
}

// Provider component
export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, dispatch] = useReducer(
    documentReducer,
    null,
    createInitialDocument
  );

  return (
    <DocumentContext.Provider value={{ document, dispatch }}>
      {children}
    </DocumentContext.Provider>
  );
}

// Custom hook to use the document context
export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
