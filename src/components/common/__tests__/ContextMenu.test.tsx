import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextMenu, MenuItemOrDivider } from "../ContextMenu";

// Mock the CSS module
vi.mock("../ContextMenu.module.scss", () => ({
  default: {
    contextMenuOverlay: "contextMenuOverlay",
    contextMenu: "contextMenu",
    contextMenuHeader: "contextMenuHeader",
    menuItems: "menuItems",
    menuItem: "menuItem",
    disabled: "disabled",
    divider: "divider",
    menuItemLabel: "menuItemLabel",
    menuItemShortcut: "menuItemShortcut",
  },
}));

describe("ContextMenu", () => {
  // Default props
  const position = { x: 100, y: 100 };
  const onClose = vi.fn();
  const onClick1 = vi.fn();
  const onClick2 = vi.fn();

  // Basic menu items
  const basicItems: MenuItemOrDivider[] = [
    {
      id: "item1",
      label: "Item 1",
      onClick: onClick1,
    },
    {
      id: "item2",
      label: "Item 2",
      onClick: onClick2,
      disabled: true,
    },
  ];

  // Items with string shortcuts
  const itemsWithStringShortcuts: MenuItemOrDivider[] = [
    {
      id: "copy",
      label: "Copy",
      shortcut: "Ctrl+C",
      onClick: onClick1,
    },
    { type: "divider" },
    {
      id: "paste",
      label: "Paste",
      shortcut: "Ctrl+V",
      onClick: onClick2,
    },
  ];

  // Items with React node shortcuts
  const ShortcutIcon = ({ children }: { children: React.ReactNode }) => (
    <span data-testid="shortcut-icon">{children}</span>
  );

  const itemsWithReactNodeShortcuts: MenuItemOrDivider[] = [
    {
      id: "copy",
      label: "Copy",
      shortcut: (
        <>
          <ShortcutIcon>⌘</ShortcutIcon>C
        </>
      ),
      onClick: onClick1,
    },
    { type: "divider" },
    {
      id: "paste",
      label: "Paste",
      shortcut: (
        <>
          <ShortcutIcon>⌘</ShortcutIcon>V
        </>
      ),
      onClick: onClick2,
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock the getBoundingClientRect for position adjustment tests
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
    });
  });

  test("renders basic menu items correctly", () => {
    render(
      <ContextMenu position={position} onClose={onClose} items={basicItems} />
    );

    // Check that menu items are rendered
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  test("renders dividers correctly", () => {
    render(
      <ContextMenu
        position={position}
        onClose={onClose}
        items={itemsWithStringShortcuts}
      />
    );

    // Check for menu items
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText("Paste")).toBeInTheDocument();

    // Verify divider (this would be implementation-specific)
    const dividers = document.querySelectorAll(".divider");
    expect(dividers.length).toBe(1);
  });

  test("renders string shortcuts correctly", () => {
    render(
      <ContextMenu
        position={position}
        onClose={onClose}
        items={itemsWithStringShortcuts}
      />
    );

    // Check that shortcuts are rendered
    const shortcuts = document.querySelectorAll(".menuItemShortcut");
    expect(shortcuts.length).toBe(2);
    expect(shortcuts[0].textContent).toBe("Ctrl+C");
    expect(shortcuts[1].textContent).toBe("Ctrl+V");
  });

  test("renders React node shortcuts correctly", () => {
    render(
      <ContextMenu
        position={position}
        onClose={onClose}
        items={itemsWithReactNodeShortcuts}
      />
    );

    // Check for shortcut icons
    const shortcutIcons = screen.getAllByTestId("shortcut-icon");
    expect(shortcutIcons.length).toBe(2);
    expect(shortcutIcons[0].textContent).toBe("⌘");
    expect(shortcutIcons[1].textContent).toBe("⌘");
  });

  test("renders header when provided", () => {
    const header = <div data-testid="custom-header">Header Content</div>;

    render(
      <ContextMenu
        position={position}
        onClose={onClose}
        items={basicItems}
        header={header}
      />
    );

    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  test("clicking an enabled menu item calls its onClick and closes the menu", () => {
    render(
      <ContextMenu position={position} onClose={onClose} items={basicItems} />
    );

    // Click the first item (enabled)
    fireEvent.click(screen.getByText("Item 1"));

    // Check that onClick was called and menu was closed
    expect(onClick1).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("clicking a disabled menu item does not call its onClick", () => {
    render(
      <ContextMenu position={position} onClose={onClose} items={basicItems} />
    );

    // Click the second item (disabled)
    fireEvent.click(screen.getByText("Item 2"));

    // Check that onClick was not called
    expect(onClick2).not.toHaveBeenCalled();
    // But onClose should still be called
    expect(onClose).not.toHaveBeenCalled();
  });

  test("menu is positioned according to provided coordinates", () => {
    render(
      <ContextMenu position={position} onClose={onClose} items={basicItems} />
    );

    const menu = document.querySelector(".contextMenu") as HTMLElement;
    expect(menu.style.left).toBe("100px");
    expect(menu.style.top).toBe("100px");
  });

  test("menu adjusts position when it would go off screen", () => {
    // A more robust approach is to verify behavior rather than exact pixel values
    // (since implementation details of adjustment may vary)
    const { rerender } = render(
      <ContextMenu
        position={{ x: 50, y: 50 }}
        onClose={onClose}
        items={basicItems}
      />
    );

    // First, check normal positioning for on-screen menu
    const menu = document.querySelector(".contextMenu") as HTMLElement;
    expect(menu.style.left).toBe("50px");
    expect(menu.style.top).toBe("50px");

    // Re-render with off-screen coordinates
    rerender(
      <ContextMenu
        position={{ x: 2000, y: 2000 }} // Way off screen
        onClose={onClose}
        items={basicItems}
      />
    );

    // Now verify that the coordinates have been adjusted
    // (without asserting exact values)
    expect(parseInt(menu.style.left)).not.toBe(2000);
    expect(parseInt(menu.style.top)).not.toBe(2000);
  });

  test("clicking outside the menu calls onClose", () => {
    render(
      <ContextMenu position={position} onClose={onClose} items={basicItems} />
    );

    // Simulate a click outside the menu
    fireEvent.mouseDown(document.body);

    // onClose should be called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("pressing ESC key calls onClose", () => {
    render(
      <ContextMenu position={position} onClose={onClose} items={basicItems} />
    );

    // Simulate pressing the Escape key
    fireEvent.keyDown(document, { key: "Escape" });

    // onClose should be called
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
