import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { StageControls } from "../StageControls";

// Mock the CSS module
vi.mock("../StageControls.module.scss", () => ({
  default: {
    stageControls: "stageControls",
    controlIcon: "controlIcon",
    active: "active",
    shortcutIndicator: "shortcutIndicator",
  },
}));

// Mock the clsx library with a simpler implementation
vi.mock("clsx", () => ({
  // This simple implementation just makes it easy to test if a class is included
  default: vi.fn((...args) => {
    const result: string[] = [];

    args.forEach((arg) => {
      if (typeof arg === "string") {
        result.push(arg);
      } else if (arg && typeof arg === "object") {
        Object.keys(arg).forEach((key) => {
          if (arg[key]) {
            result.push(key);
          }
        });
      }
    });

    return result.join(" ");
  }),
}));

describe("StageControls", () => {
  test("renders grid and snap control buttons", () => {
    render(
      <StageControls
        showGrid={true}
        snapToGrid={true}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    expect(screen.getByTitle("Toggle Grid Visibility (G)")).toBeInTheDocument();
    expect(screen.getByTitle("Toggle Snap to Grid (S)")).toBeInTheDocument();
  });

  test("calls onToggleGrid when grid button is clicked", () => {
    const onToggleGrid = vi.fn();
    const onToggleSnap = vi.fn();

    render(
      <StageControls
        showGrid={true}
        snapToGrid={true}
        onToggleGrid={onToggleGrid}
        onToggleSnap={onToggleSnap}
      />
    );

    fireEvent.click(screen.getByTitle("Toggle Grid Visibility (G)"));

    expect(onToggleGrid).toHaveBeenCalledTimes(1);
    expect(onToggleSnap).not.toHaveBeenCalled();
  });

  test("calls onToggleSnap when snap button is clicked", () => {
    const onToggleGrid = vi.fn();
    const onToggleSnap = vi.fn();

    render(
      <StageControls
        showGrid={true}
        snapToGrid={true}
        onToggleGrid={onToggleGrid}
        onToggleSnap={onToggleSnap}
      />
    );

    fireEvent.click(screen.getByTitle("Toggle Snap to Grid (S)"));

    expect(onToggleSnap).toHaveBeenCalledTimes(1);
    expect(onToggleGrid).not.toHaveBeenCalled();
  });

  test("applies active class based on props", () => {
    // With both enabled
    const { rerender } = render(
      <StageControls
        showGrid={true}
        snapToGrid={true}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    const gridButton = screen.getByTitle("Toggle Grid Visibility (G)");
    const snapButton = screen.getByTitle("Toggle Snap to Grid (S)");

    // Checking if the active class is applied (via mocked clsx)
    expect(gridButton.className).toContain("active");
    expect(snapButton.className).toContain("active");

    // Rerender with grid disabled
    rerender(
      <StageControls
        showGrid={false}
        snapToGrid={true}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    expect(gridButton.className).not.toContain("active");
    expect(snapButton.className).toContain("active");

    // Rerender with snap disabled
    rerender(
      <StageControls
        showGrid={true}
        snapToGrid={false}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    expect(gridButton.className).toContain("active");
    expect(snapButton.className).not.toContain("active");

    // Rerender with both disabled
    rerender(
      <StageControls
        showGrid={false}
        snapToGrid={false}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    expect(gridButton.className).not.toContain("active");
    expect(snapButton.className).not.toContain("active");
  });

  test("has correct accessibility attributes", () => {
    render(
      <StageControls
        showGrid={true}
        snapToGrid={true}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    // Check grid button accessibility
    const gridButton = screen.getByTitle("Toggle Grid Visibility (G)");
    const gridSpan = gridButton.querySelector("span");
    expect(gridSpan).toHaveAttribute("role", "img");
    expect(gridSpan).toHaveAttribute("aria-label", "Show Grid");

    // Check snap button accessibility
    const snapButton = screen.getByTitle("Toggle Snap to Grid (S)");
    const snapSpan = snapButton.querySelector("span");
    expect(snapSpan).toHaveAttribute("role", "img");
    expect(snapSpan).toHaveAttribute("aria-label", "Snap to Grid");
  });

  test("renders keyboard shortcut indicators", () => {
    render(
      <StageControls
        showGrid={true}
        snapToGrid={true}
        onToggleGrid={() => {}}
        onToggleSnap={() => {}}
      />
    );

    // Check if the shortcut indicators are rendered
    const gridShortcut = screen.getByText("G");
    const snapShortcut = screen.getByText("S");

    expect(gridShortcut).toBeInTheDocument();
    expect(snapShortcut).toBeInTheDocument();
  });
});
