import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { getLocale } from "./i18n";
import { initTheme } from "./theme";
import App from "./App";
import "./index.css";

document.documentElement.lang = getLocale();
initTheme();

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
