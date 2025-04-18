import { AppLayout } from "./components/layout/AppLayout";
import { useDocumentService } from "./services/documentService";
import "./App.scss";

function App() {
  const { document } = useDocumentService();

  // Placeholder components - these will be replaced with actual components later
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

  const MainPlaceholder = () => (
    <div style={{ padding: "20px" }}>
      <h2>Stage Area</h2>
      <p>
        Stage: {document.stage.width} x {document.stage.height}
      </p>
      <p>Items: {document.items.length}</p>
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
      main={<MainPlaceholder />}
      sidePanel={<SidePanelPlaceholder />}
    />
  );
}

export default App;
