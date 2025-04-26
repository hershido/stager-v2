import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DocumentProvider, useDocument } from "../DocumentContext";
import {
  StageItem,
  StagerDocument,
  createInitialDocument,
} from "../../types/document";

// Helper function to wrap the component in the provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DocumentProvider>{children}</DocumentProvider>
);

describe("DocumentContext", () => {
  beforeEach(() => {
    // Mock Date.now to return a consistent timestamp for testing
    vi.spyOn(Date, "now").mockImplementation(() => 1234567890);
  });

  it("should provide the initial document state", () => {
    const { result } = renderHook(() => useDocument(), { wrapper });

    expect(result.current.document).toMatchObject({
      id: expect.any(String),
      name: "Untitled Stage Plan",
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      version: "1.0",
      stage: expect.any(Object),
      items: expect.any(Array),
      inputOutput: expect.any(Object),
      technicalInfo: expect.any(Object),
    });
  });

  describe("dispatch actions", () => {
    it("should update document with UPDATE_DOCUMENT action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: "UPDATE_DOCUMENT",
          updates: { name: "Updated Document Name" },
        });
      });

      expect(result.current.document.name).toBe("Updated Document Name");
      expect(result.current.document.updatedAt).toBe(1234567890);
    });

    it("should update stage with UPDATE_STAGE action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: "UPDATE_STAGE",
          updates: { width: 1500, backgroundColor: "#ffffff" },
        });
      });

      expect(result.current.document.stage.width).toBe(1500);
      expect(result.current.document.stage.backgroundColor).toBe("#ffffff");
      expect(result.current.document.updatedAt).toBe(1234567890);
    });

    it("should add item with ADD_ITEM action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      const newItem: StageItem = {
        id: "test-item-1",
        name: "Test Item",
        category: "equipment",
        icon: "test-icon",
        position: { x: 100, y: 200 },
        width: 50,
        height: 50,
      };

      act(() => {
        result.current.dispatch({
          type: "ADD_ITEM",
          item: newItem,
        });
      });

      expect(result.current.document.items).toHaveLength(1);
      expect(result.current.document.items[0]).toEqual(newItem);
      expect(result.current.document.updatedAt).toBe(1234567890);
    });

    it("should update item with UPDATE_ITEM action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      // First add an item
      const item: StageItem = {
        id: "test-item-1",
        name: "Test Item",
        category: "equipment",
        icon: "test-icon",
        position: { x: 100, y: 200 },
        width: 50,
        height: 50,
      };

      act(() => {
        result.current.dispatch({
          type: "ADD_ITEM",
          item,
        });
      });

      // Then update it
      act(() => {
        result.current.dispatch({
          type: "UPDATE_ITEM",
          id: "test-item-1",
          updates: {
            name: "Updated Item",
            position: { x: 150, y: 250 },
          },
        });
      });

      expect(result.current.document.items[0].name).toBe("Updated Item");
      expect(result.current.document.items[0].position).toEqual({
        x: 150,
        y: 250,
      });
      expect(result.current.document.updatedAt).toBe(1234567890);
    });

    it("should remove item with REMOVE_ITEM action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      // Add two items
      const item1: StageItem = {
        id: "test-item-1",
        name: "Test Item 1",
        category: "equipment",
        icon: "test-icon-1",
        position: { x: 100, y: 200 },
        width: 50,
        height: 50,
      };

      const item2: StageItem = {
        id: "test-item-2",
        name: "Test Item 2",
        category: "equipment",
        icon: "test-icon-2",
        position: { x: 300, y: 400 },
        width: 50,
        height: 50,
      };

      act(() => {
        result.current.dispatch({ type: "ADD_ITEM", item: item1 });
        result.current.dispatch({ type: "ADD_ITEM", item: item2 });
      });

      expect(result.current.document.items).toHaveLength(2);

      // Remove one item
      act(() => {
        result.current.dispatch({
          type: "REMOVE_ITEM",
          id: "test-item-1",
        });
      });

      expect(result.current.document.items).toHaveLength(1);
      expect(result.current.document.items[0].id).toBe("test-item-2");
      expect(result.current.document.updatedAt).toBe(1234567890);
    });

    it("should load document with LOAD_DOCUMENT action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      const newDocument: StagerDocument = {
        ...createInitialDocument(),
        id: "new-document-id",
        name: "Loaded Document",
        createdAt: 1000000000,
        updatedAt: 2000000000,
      };

      act(() => {
        result.current.dispatch({
          type: "LOAD_DOCUMENT",
          document: newDocument,
        });
      });

      expect(result.current.document).toEqual(newDocument);
    });

    it("should create new document with NEW_DOCUMENT action", () => {
      const { result } = renderHook(() => useDocument(), { wrapper });

      // First change the document
      act(() => {
        result.current.dispatch({
          type: "UPDATE_DOCUMENT",
          updates: { name: "Modified Document" },
        });
      });

      expect(result.current.document.name).toBe("Modified Document");

      // Then create a new document
      act(() => {
        result.current.dispatch({ type: "NEW_DOCUMENT" });
      });

      // Document should be reset to initial state (except for id and timestamps)
      expect(result.current.document.name).toBe("Untitled Stage Plan");
    });
  });

  it("should throw an error if useDocument is used outside a DocumentProvider", () => {
    expect(() => {
      renderHook(() => useDocument());
    }).toThrow("useDocument must be used within a DocumentProvider");
  });
});
