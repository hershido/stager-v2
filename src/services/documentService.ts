import { useMemo } from "react";
import { StageItem, StagerDocument } from "../types/document";
import { useDocument } from "../context/DocumentContext";

// Define action types to avoid 'any'
type DocumentAction =
  | { type: "UPDATE_DOCUMENT"; updates: Partial<StagerDocument> }
  | { type: "UPDATE_STAGE"; updates: Partial<StagerDocument["stage"]> }
  | { type: "ADD_ITEM"; item: StageItem }
  | { type: "UPDATE_ITEM"; id: string; updates: Partial<StageItem> }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "LOAD_DOCUMENT"; document: StagerDocument }
  | { type: "NEW_DOCUMENT" };

// Define the service type
export interface DocumentService {
  // Document lifecycle
  createNew: () => void;
  loadDocument: (document: StagerDocument) => void;

  // Document updates
  updateDocument: (updates: Partial<StagerDocument>) => void;
  updateStage: (updates: Partial<StagerDocument["stage"]>) => void;

  // Item management
  addItem: (item: StageItem) => void;
  updateItem: (id: string, updates: Partial<StageItem>) => void;
  removeItem: (id: string) => void;

  // Current document state
  getCurrentDocument: () => StagerDocument;
}

// Factory function to create a document service
export function createDocumentService(
  dispatch: React.Dispatch<DocumentAction>,
  getDocument: () => StagerDocument
): DocumentService {
  return {
    createNew: () => {
      dispatch({ type: "NEW_DOCUMENT" });
    },

    loadDocument: (document) => {
      dispatch({ type: "LOAD_DOCUMENT", document });
    },

    updateDocument: (updates) => {
      dispatch({ type: "UPDATE_DOCUMENT", updates });
    },

    updateStage: (updates) => {
      dispatch({ type: "UPDATE_STAGE", updates });
    },

    addItem: (item) => {
      dispatch({ type: "ADD_ITEM", item });
    },

    updateItem: (id, updates) => {
      dispatch({ type: "UPDATE_ITEM", id, updates });
    },

    removeItem: (id) => {
      dispatch({ type: "REMOVE_ITEM", id });
    },

    getCurrentDocument: getDocument,
  };
}

// Custom hook to use the document service in components
export function useDocumentService() {
  const { dispatch, document } = useDocument();

  // Memoize the service so it's stable across renders
  const documentService = useMemo(
    () => createDocumentService(dispatch, () => document),
    [dispatch, document]
  );

  return { documentService, document };
}
