import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Validates environment variables on startup, so a bad .env fails fast (EC-76)
import "@/lib/env";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
