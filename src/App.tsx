import { useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { KeyboardProvider } from "./contexts/KeyboardContext";
import { StageContainer } from "./components/stage-components/container/StageContainer";
import "./App.scss";

function App() {
  // Debug the App component and keyboard events
  useEffect(() => {
    console.log("App component mounted with KeyboardProvider");

    // Debug listener to check if events reach the document level
    const debugKeyDown = (e: KeyboardEvent) => {
      console.log(`App debug: Key pressed at document level: ${e.key}`);
    };

    document.addEventListener("keydown", debugKeyDown);

    return () => {
      console.log("App component unmounted");
      document.removeEventListener("keydown", debugKeyDown);
    };
  }, []);

  // Add a custom wrapper for the KeyboardProvider to debug its initialization
  const DebugKeyboardProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    useEffect(() => {
      console.log("KeyboardProvider mounted and initialized");
      return () => console.log("KeyboardProvider unmounted");
    }, []);

    return <KeyboardProvider>{children}</KeyboardProvider>;
  };

  return (
    <DebugKeyboardProvider>
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
    </DebugKeyboardProvider>
  );
}

export default App;
