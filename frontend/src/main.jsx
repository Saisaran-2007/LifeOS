import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./Auth.css";

import AuthGate from "./AuthGate";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>
);