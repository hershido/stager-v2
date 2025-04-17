import { useDocument } from "./context/DocumentContext";
import "./App.css";

function App() {
  const { document, dispatch } = useDocument();

  // Update document name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "UPDATE_DOCUMENT",
      updates: { name: e.target.value },
    });
  };

  // Update stage dimensions
  const handleStageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({
      type: "UPDATE_STAGE",
      updates: { [name]: parseInt(value, 10) },
    });
  };

  // Add a simple stage item
  const addItem = () => {
    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_ITEM",
      item: {
        id,
        name: `Item ${document.items.length + 1}`,
        category: "instruments",
        icon: "default-icon",
        position: { x: 100, y: 100 },
      },
    });
  };

  // Create a new document
  const newDocument = () => {
    dispatch({ type: "NEW_DOCUMENT" });
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
          <button onClick={addItem}>Add Test Item</button>
          <ul>
            {document.items.map((item) => (
              <li key={item.id}>
                {item.name} ({item.position.x}, {item.position.y})
                <button
                  onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })}
                >
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
