import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initApiConfig } from "./api";
import App from "./App.tsx";
import "./index.css";

async function boot(): Promise<void> {
  await initApiConfig();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
