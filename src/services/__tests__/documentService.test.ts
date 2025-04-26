import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { createDocumentService, useDocumentService } from "../documentService";
import {
  StageItem,
  StagerDocument,
  createInitialDocument,
} from "../../types/document";
import * as DocumentContext from "../../context/DocumentContext";

describe("documentService", () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let getDocument: ReturnType<typeof vi.fn>;
  let documentService: ReturnType<typeof createDocumentService>;
  let initialDocument: StagerDocument;

  beforeEach(() => {
    initialDocument = createInitialDocument();
    dispatch = vi.fn();
    getDocument = vi.fn().mockReturnValue(initialDocument);
    documentService = createDocumentService(dispatch, getDocument);
  });

  describe("createDocumentService", () => {
    it("should create a document service with all methods", () => {
      expect(documentService).toHaveProperty("createNew");
      expect(documentService).toHaveProperty("loadDocument");
      expect(documentService).toHaveProperty("updateDocument");
      expect(documentService).toHaveProperty("updateStage");
      expect(documentService).toHaveProperty("addItem");
      expect(documentService).toHaveProperty("updateItem");
      expect(documentService).toHaveProperty("removeItem");
      expect(documentService).toHaveProperty("getCurrentDocument");
    });

    describe("createNew", () => {
      it("should dispatch NEW_DOCUMENT action", () => {
        documentService.createNew();

        expect(dispatch).toHaveBeenCalledWith({ type: "NEW_DOCUMENT" });
      });
    });

    describe("loadDocument", () => {
      it("should dispatch LOAD_DOCUMENT action with document", () => {
        const document = createInitialDocument();

        documentService.loadDocument(document);

        expect(dispatch).toHaveBeenCalledWith({
          type: "LOAD_DOCUMENT",
          document,
        });
      });
    });

    describe("updateDocument", () => {
      it("should dispatch UPDATE_DOCUMENT action with updates", () => {
        const updates = { name: "Updated Document" };

        documentService.updateDocument(updates);

        expect(dispatch).toHaveBeenCalledWith({
          type: "UPDATE_DOCUMENT",
          updates,
        });
      });
    });

    describe("updateStage", () => {
      it("should dispatch UPDATE_STAGE action with updates", () => {
        const updates = { width: 1200, height: 800 };

        documentService.updateStage(updates);

        expect(dispatch).toHaveBeenCalledWith({
          type: "UPDATE_STAGE",
          updates,
        });
      });
    });

    describe("addItem", () => {
      it("should dispatch ADD_ITEM action with item", () => {
        const item: StageItem = {
          id: "item-1",
          name: "Test Item",
          category: "equipment",
          icon: "test-icon",
          position: { x: 100, y: 100 },
          width: 50,
          height: 50,
        };

        documentService.addItem(item);

        expect(dispatch).toHaveBeenCalledWith({
          type: "ADD_ITEM",
          item,
        });
      });
    });

    describe("updateItem", () => {
      it("should dispatch UPDATE_ITEM action with id and updates", () => {
        const id = "item-1";
        const updates = { name: "Updated Item", position: { x: 200, y: 200 } };

        documentService.updateItem(id, updates);

        expect(dispatch).toHaveBeenCalledWith({
          type: "UPDATE_ITEM",
          id,
          updates,
        });
      });
    });

    describe("removeItem", () => {
      it("should dispatch REMOVE_ITEM action with id", () => {
        const id = "item-1";

        documentService.removeItem(id);

        expect(dispatch).toHaveBeenCalledWith({
          type: "REMOVE_ITEM",
          id,
        });
      });
    });

    describe("getCurrentDocument", () => {
      it("should return current document state", () => {
        const document = documentService.getCurrentDocument();

        expect(getDocument).toHaveBeenCalled();
        expect(document).toBe(initialDocument);
      });
    });
  });

  describe("useDocumentService", () => {
    it("should return documentService and document", () => {
      // Mock the useDocument hook
      const mockUseDocument = vi.spyOn(DocumentContext, "useDocument");
      mockUseDocument.mockReturnValue({
        dispatch: vi.fn(),
        document: initialDocument,
      });

      const { result } = renderHook(() => useDocumentService());

      expect(result.current).toHaveProperty("documentService");
      expect(result.current).toHaveProperty("document");
      expect(result.current.document).toBe(initialDocument);
    });
  });
});
