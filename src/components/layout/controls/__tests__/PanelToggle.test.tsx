import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelToggle } from "../PanelToggle";

// Mock the image imports
vi.mock("../../../assets/layout/openSidePanelIcon.svg", () => "open-icon-mock");
vi.mock(
  "../../../assets/layout/closeSidePanelIcon.svg",
  () => "close-icon-mock"
);

describe("PanelToggle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders correctly when closed", () => {
    const handleToggle = vi.fn();
    render(
      <PanelToggle
        isOpen={false}
        onToggle={handleToggle}
        title="Test panel toggle"
      />
    );

    // Find the toggle button by its title
    const toggle = screen.getByTitle("Test panel toggle");
    expect(toggle).toBeInTheDocument();

    // Check that it shows the open icon when closed
    const icon = screen.getByAltText("Open panel");
    expect(icon).toBeInTheDocument();
  });

  it("renders correctly when open", () => {
    const handleToggle = vi.fn();
    render(
      <PanelToggle
        isOpen={true}
        onToggle={handleToggle}
        title="Test panel toggle"
      />
    );

    // Find the toggle button by its title
    const toggle = screen.getByTitle("Test panel toggle");
    expect(toggle).toBeInTheDocument();

    // Check that it shows the close icon when open
    const icon = screen.getByAltText("Close panel");
    expect(icon).toBeInTheDocument();
  });

  it("calls onToggle handler when clicked", () => {
    const handleToggle = vi.fn();
    render(
      <PanelToggle
        isOpen={false}
        onToggle={handleToggle}
        title="Test panel toggle"
      />
    );

    const toggle = screen.getByTitle("Test panel toggle");
    fireEvent.click(toggle);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("calls timer after click", () => {
    const handleToggle = vi.fn();

    // Spy on setTimeout
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    render(
      <PanelToggle
        isOpen={false}
        onToggle={handleToggle}
        title="Test panel toggle"
      />
    );

    const toggle = screen.getByTitle("Test panel toggle");

    // Click should trigger setTimeout
    fireEvent.click(toggle);

    // Verify setTimeout was called
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 100);

    // Clean up
    setTimeoutSpy.mockRestore();
  });
});
