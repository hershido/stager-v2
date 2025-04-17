import { StageItem, LabelItem, isLabelItem } from "./types/document";
import { useDocumentService } from "./services/documentService";
import "./App.css";

function App() {
  const { documentService, document } = useDocumentService();

  // Update document name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    documentService.updateDocument({ name: e.target.value });
  };

  // Update stage dimensions
  const handleStageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    documentService.updateStage({ [name]: parseInt(value, 10) });
  };

  // Add a regular stage item
  const addItem = () => {
    const id = crypto.randomUUID();
    documentService.addItem({
      id,
      name: `Item ${document.items.length + 1}`,
      category: "instruments",
      icon: "default-icon",
      position: { x: 100, y: 100 },
    });
  };

  // Add a label item
  const addLabel = () => {
    const id = crypto.randomUUID();
    const labelItem: LabelItem = {
      id,
      name: `Label ${document.items.length + 1}`,
      category: "labels",
      icon: "text-icon",
      position: { x: 200, y: 150 },
      textContent: "Stage Front",
      textFormatting: {
        isBold: true,
        fontSize: 16,
        textColor: "#000000",
      },
    };
    documentService.addItem(labelItem);
  };

  // Create a new document
  const newDocument = () => {
    documentService.createNew();
  };

  // Render item details with special handling for label items
  const renderItemDetails = (item: StageItem) => {
    if (isLabelItem(item)) {
      return (
        <span className="item-details label-item">
          <strong>Label:</strong> {item.textContent}
          {item.textFormatting?.isBold && (
            <span className="label-format"> (Bold)</span>
          )}
        </span>
      );
    } else {
      return (
        <span className="item-details">
          <strong>{item.category}:</strong> {item.name} at ({item.position.x},{" "}
          {item.position.y})
        </span>
      );
    }
  };

  // Display document as JSON for debugging
  const documentJson = JSON.stringify(document, null, 2);

  return (
    <div className="app-container">
      <h1>Stage Planner - Document Test</h1>

      <div className="document-form">
        <div className="form-group">
          <label>
            Document Name:
            <input
              type="text"
              value={document.name}
              onChange={handleNameChange}
            />
          </label>
        </div>

        <div className="form-group">
          <h3>Stage Properties</h3>
          <label>
            Width:
            <input
              type="number"
              name="width"
              value={document.stage.width}
              onChange={handleStageChange}
            />
          </label>
          <label>
            Height:
            <input
              type="number"
              name="height"
              value={document.stage.height}
              onChange={handleStageChange}
            />
          </label>
          <label>
            Grid Size:
            <input
              type="number"
              name="gridSize"
              value={document.stage.gridSize}
              onChange={handleStageChange}
            />
          </label>
        </div>

        <div className="form-group">
          <h3>Stage Items</h3>
          <div className="button-group">
            <button onClick={addItem}>Add Regular Item</button>
            <button onClick={addLabel}>Add Label</button>
          </div>
          <ul>
            {document.items.map((item) => (
              <li key={item.id}>
                {renderItemDetails(item)}
                <button onClick={() => documentService.removeItem(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-group">
          <button onClick={newDocument}>New Document</button>
        </div>
      </div>

      <div className="document-json">
        <h3>Document JSON:</h3>
        <pre>{documentJson}</pre>
      </div>
    </div>
  );
}

export default App;
