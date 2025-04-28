import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { KeyboardProvider, useShortcut } from "./contexts/KeyboardContext";
import { StageContainer } from "./components/stage-components/container/StageContainer";
import "./App.scss";

// Test component to validate shortcuts
function ShortcutTestComponent() {
  console.log("ShortcutTestComponent rendered");

  // Register a test shortcut - just "t" key
  useShortcut(
    "t",
    (e) => {
      console.log("TEST SHORTCUT TRIGGERED - T key pressed!");
      e.preventDefault();
      alert("T key shortcut works!");
    },
    [],
    { priority: 100 }
  );

  // Also test alt key combination
  useShortcut(
    "alt+t",
    (e) => {
      console.log("TEST SHORTCUT TRIGGERED - Alt+T key pressed!");
      e.preventDefault();
      alert("Alt+T shortcut works!");
    },
    [],
    { priority: 100 }
  );

  return null; // This is just a functionality component, no UI
}

function App() {
  // Debug the App component and keyboard events
  useEffect(() => {
    console.log("App component mounted with KeyboardProvider");

    // Debug listener to check if events reach the document level
    const debugKeyDown = (e: KeyboardEvent) => {
      console.log(
        `App debug: Key pressed at document level: ${e.key} (code: ${e.code}), alt: ${e.altKey}`
      );
    };

    document.addEventListener("keydown", debugKeyDown);

    return () => {
      console.log("App component unmounted");
      document.removeEventListener("keydown", debugKeyDown);
    };
  }, []);

  return (
    <KeyboardProvider>
      <ShortcutTestComponent />
      <AppLayout
        header={
          <div style={{ padding: "20px", height: "100%" }}>
            <h1>Header</h1>
          </div>
        }
        sidebar={
          <div style={{ padding: "20px" }}>
            <h2>Sidebar</h2>
            <p>Items will go here</p>
          </div>
        }
        main={<StageContainer />}
        sidePanel={
          <div style={{ padding: "20px" }}>
            <h2>Properties Panel</h2>
            <p>Item properties will go here</p>
          </div>
        }
      />
    </KeyboardProvider>
  );
}

export default App;
