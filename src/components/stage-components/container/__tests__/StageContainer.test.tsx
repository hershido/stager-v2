import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { StageContainer } from "../StageContainer";

// Mock the child components
vi.mock("../../controls/StageControls", () => ({
  StageControls: vi.fn(({ onToggleGrid, onToggleSnap }) => {
    return (
      <div data-testid="mock-stage-controls">
        <button data-testid="toggle-grid-btn" onClick={onToggleGrid}>
          Toggle Grid
        </button>
        <button data-testid="toggle-snap-btn" onClick={onToggleSnap}>
          Toggle Snap
        </button>
      </div>
    );
  }),
}));

vi.mock("../../stage/Stage", () => ({
  Stage: vi.fn(({ showGrid, snapToGrid }) => (
    <div
      data-testid="mock-stage"
      data-show-grid={showGrid ? "true" : "false"}
      data-snap-to-grid={snapToGrid ? "true" : "false"}
    />
  )),
}));

// Mock the CSS module
vi.mock("../StageContainer.module.scss", () => ({
  default: {
    stageContainer: "stageContainer",
  },
}));

describe("StageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders StageControls and Stage components", () => {
    render(<StageContainer />);

    expect(screen.getByTestId("mock-stage-controls")).toBeInTheDocument();
    expect(screen.getByTestId("mock-stage")).toBeInTheDocument();
  });

  test("initializes with grid and snap enabled", () => {
    render(<StageContainer />);

    const stageElement = screen.getByTestId("mock-stage");
    expect(stageElement).toHaveAttribute("data-show-grid", "true");
    expect(stageElement).toHaveAttribute("data-snap-to-grid", "true");
  });

  test("toggles grid visibility when grid button is clicked", async () => {
    render(<StageContainer />);

    // Initial state
    expect(screen.getByTestId("mock-stage")).toHaveAttribute(
      "data-show-grid",
      "true"
    );

    // Click the toggle grid button
    await act(async () => {
      screen.getByTestId("toggle-grid-btn").click();
    });

    // Check that the grid is now hidden
    expect(screen.getByTestId("mock-stage")).toHaveAttribute(
      "data-show-grid",
      "false"
    );

    // Click the toggle grid button again
    await act(async () => {
      screen.getByTestId("toggle-grid-btn").click();
    });

    // Check that the grid is shown again
    expect(screen.getByTestId("mock-stage")).toHaveAttribute(
      "data-show-grid",
      "true"
    );
  });

  test("toggles snap to grid when snap button is clicked", async () => {
    render(<StageContainer />);

    // Initial state
    expect(screen.getByTestId("mock-stage")).toHaveAttribute(
      "data-snap-to-grid",
      "true"
    );

    // Click the toggle snap button
    await act(async () => {
      screen.getByTestId("toggle-snap-btn").click();
    });

    // Check that snap to grid is now disabled
    expect(screen.getByTestId("mock-stage")).toHaveAttribute(
      "data-snap-to-grid",
      "false"
    );

    // Click the toggle snap button again
    await act(async () => {
      screen.getByTestId("toggle-snap-btn").click();
    });

    // Check that snap to grid is enabled again
    expect(screen.getByTestId("mock-stage")).toHaveAttribute(
      "data-snap-to-grid",
      "true"
    );
  });
});
