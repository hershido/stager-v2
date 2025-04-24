import { AppLayout } from "./components/layout/AppLayout";
import { Stage } from "./components/Stage";
import "./App.scss";

function App() {
  // Placeholder components - these will be replaced with actual components later

  console.log("App component rendering");
  const HeaderPlaceholder = () => (
    <div style={{ padding: "20px", height: "100%" }}>
      <h1>Header</h1>
    </div>
  );

  const SidebarPlaceholder = () => (
    <div style={{ padding: "20px" }}>
      <h2>Sidebar</h2>
      <p>Items will go here</p>
    </div>
  );

  const SidePanelPlaceholder = () => (
    <div style={{ padding: "20px" }}>
      <h2>Properties Panel</h2>
      <p>Item properties will go here</p>
    </div>
  );

  return (
    <AppLayout
      header={<HeaderPlaceholder />}
      sidebar={<SidebarPlaceholder />}
      main={<Stage />}
      sidePanel={<SidePanelPlaceholder />}
    />
  );
}

export default App;
