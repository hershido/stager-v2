import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { DocumentProvider } from "./context/DocumentContext.tsx";
import { ClipboardProvider } from "./context/ClipboardContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DocumentProvider>
      <ClipboardProvider>
        <App />
      </ClipboardProvider>
    </DocumentProvider>
  </StrictMode>
);
